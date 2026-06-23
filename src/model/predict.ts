import type {
  Match,
  MatchPrediction,
  MatchStage,
  ModelWeights,
  WeightSnapshot,
} from '@/types/domain';
import {
  DEFAULT_ELO_CONFIG,
  applyResult,
  applyResults,
  expectedHomeScore,
  ratingOf,
  type EloConfig,
  type EloMatchResult,
  type EloRatings,
} from './elo';
import { ELO_SEED } from './eloSeed';
import { outcomeFromEloDiff } from './probability';
import { buildFormTable, formSignal, type FormEntry } from './form';
import { squadEloDiff, squadGoalFactor } from './squad';
import { buildPrediction } from './blend';
import { labelFromScore, type ScoredPrediction } from './scoring';
import { gradientStep } from './learn';
import type { InputDistributions, MarketTable, Outcome } from './types';

/** Small bonus for the designated home side; WC venues are largely neutral. */
const PREDICT_HOME_ADVANTAGE = 35;
const BASELINE_TOTAL_GOALS = 2.6;
const SUPREMACY = 0.7;

const STAGE_IMPORTANCE: Record<MatchStage, number> = {
  group: 1,
  round32: 1.05,
  round16: 1.1,
  quarter: 1.15,
  semi: 1.2,
  third: 1.0,
  final: 1.25,
};

export interface PredictContext {
  ratings: EloRatings;
  form: Record<string, FormEntry>;
  polymarket?: MarketTable;
  books?: MarketTable;
  weights: ModelWeights;
  config?: EloConfig;
}

/**
 * Build current Elo ratings: start from the seeded snapshot, then replay
 * finished tournament results in chronological order so the ratings reflect
 * what's happened so far. This is also the hook the learning loop re-runs after
 * each completed match (commit 5).
 */
export function buildRatings(matches: Match[], config: EloConfig = DEFAULT_ELO_CONFIG): EloRatings {
  const results: EloMatchResult[] = matches
    .filter((m) => m.status === 'finished' && m.score && m.homeTeamId && m.awayTeamId)
    .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff))
    .map((m) => ({
      homeId: m.homeTeamId as string,
      awayId: m.awayTeamId as string,
      homeGoals: (m.score as { home: number }).home,
      awayGoals: (m.score as { away: number }).away,
      importance: STAGE_IMPORTANCE[m.stage],
      neutral: true,
    }));
  return applyResults({ ...ELO_SEED }, results, config);
}

function eloInput(homeId: string, awayId: string, ratings: EloRatings, config: EloConfig): Outcome {
  const diff =
    ratingOf(ratings, homeId, config) +
    PREDICT_HOME_ADVANTAGE -
    ratingOf(ratings, awayId, config);
  return outcomeFromEloDiff(diff);
}

function formInput(
  homeId: string,
  awayId: string,
  form: Record<string, FormEntry>,
): Outcome | null {
  const fh = form[homeId];
  const fa = form[awayId];
  if (!fh && !fa) return null;
  const diff = formSignal(fh) - formSignal(fa) + PREDICT_HOME_ADVANTAGE * 0.3;
  return outcomeFromEloDiff(diff);
}

/** Squad-quality input: the player-rating/league gap as an Elo-equivalent diff. */
function squadInput(homeId: string, awayId: string): Outcome {
  const diff = squadEloDiff(homeId, awayId) + PREDICT_HOME_ADVANTAGE * 0.4;
  return outcomeFromEloDiff(diff);
}

/**
 * Expected goals for each side. The Elo supremacy sets the baseline split, then
 * squad quality (player ratings × the leagues they play in) nudges each side's
 * goals up or down — so a team packed with top-five-league talent is modelled to
 * convert its chances a little better. This is what turns into the scoreline.
 */
function expectedGoals(
  homeId: string,
  awayId: string,
  ratings: EloRatings,
  config: EloConfig,
): { home: number; away: number } {
  const e = expectedHomeScore(
    ratingOf(ratings, homeId, config),
    ratingOf(ratings, awayId, config),
    PREDICT_HOME_ADVANTAGE,
  );
  const home = BASELINE_TOTAL_GOALS * (0.5 + SUPREMACY * (e - 0.5)) * squadGoalFactor(homeId, awayId);
  const away = BASELINE_TOTAL_GOALS * (0.5 - SUPREMACY * (e - 0.5)) * squadGoalFactor(awayId, homeId);
  return { home: Math.max(0.2, home), away: Math.max(0.2, away) };
}

/** Predict a single match; null if either side is undetermined (TBD). */
export function predictMatch(
  match: Match,
  ctx: PredictContext,
  now: string = new Date().toISOString(),
): MatchPrediction | null {
  if (!match.homeTeamId || !match.awayTeamId) return null;
  const config = ctx.config ?? DEFAULT_ELO_CONFIG;

  const inputs: InputDistributions = {
    elo: eloInput(match.homeTeamId, match.awayTeamId, ctx.ratings, config),
    form: formInput(match.homeTeamId, match.awayTeamId, ctx.form),
    squad: squadInput(match.homeTeamId, match.awayTeamId),
    polymarket: ctx.polymarket?.[match.id] ?? null,
    books: ctx.books?.[match.id] ?? null,
  };
  const xg = expectedGoals(match.homeTeamId, match.awayTeamId, ctx.ratings, config);
  return buildPrediction(match.id, inputs, ctx.weights, xg, now);
}

export function predictAll(
  matches: Match[],
  ctx: PredictContext,
  now: string = new Date().toISOString(),
): Record<string, MatchPrediction> {
  const out: Record<string, MatchPrediction> = {};
  for (const match of matches) {
    const pred = predictMatch(match, ctx, now);
    if (pred) out[match.id] = pred;
  }
  return out;
}

export interface RunModelResult {
  /** Pre-match predictions for finished matches; current-context for the rest. */
  predictions: Record<string, MatchPrediction>;
  /** Pre-match prediction vs actual, for honest Brier / log-loss tracking. */
  scored: ScoredPrediction[];
  /** Final ratings after replaying every finished result. */
  ratings: EloRatings;
  /** Weights after learning from every finished result. */
  weights: ModelWeights;
  /** Weight trajectory: the base, then one snapshot per finished match. */
  history: WeightSnapshot[];
}

interface RunMarket {
  books?: MarketTable;
  polymarket?: MarketTable;
}

interface RunOptions {
  /** Step size for post-match weight learning. 0 disables learning. */
  learningRate?: number;
}

/**
 * The full model pass. Replays the tournament chronologically so every finished
 * match is predicted with the ratings, form, and weights available *before*
 * kickoff — no peeking at the result it's scored against. After each finished
 * match it (a) records the score for accuracy and (b) nudges the weights toward
 * whichever input was more correct. Upcoming matches are then predicted with the
 * learned weights and latest ratings.
 *
 * Fully deterministic from (matches, baseWeights, market), so it can be re-run
 * wholesale without incremental state drifting out of sync.
 */
export function runModel(
  matches: Match[],
  baseWeights: ModelWeights,
  market: RunMarket = {},
  options: RunOptions = {},
  config: EloConfig = DEFAULT_ELO_CONFIG,
): RunModelResult {
  const learningRate = options.learningRate ?? 0.04;
  const ordered = [...matches].sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));

  let ratings: EloRatings = { ...ELO_SEED };
  let weights: ModelWeights = { ...baseWeights };
  const finished: Match[] = [];
  const predictions: Record<string, MatchPrediction> = {};
  const scored: ScoredPrediction[] = [];
  const history: WeightSnapshot[] = [
    { matchId: null, weights: { ...weights }, brier: null, timestamp: ordered[0]?.kickoff ?? new Date().toISOString() },
  ];

  for (const match of ordered) {
    const ctx: PredictContext = {
      ratings,
      form: buildFormTable(finished),
      weights,
      books: market.books,
      polymarket: market.polymarket,
      config,
    };
    const pred = predictMatch(match, ctx, match.kickoff);
    if (pred) {
      predictions[match.id] = pred;
      if (match.status === 'finished' && match.score) {
        scored.push({
          pred: { homeWin: pred.homeWin, draw: pred.draw, awayWin: pred.awayWin },
          actual: labelFromScore(match.score),
        });
      }
    }

    if (match.status === 'finished' && match.score && match.homeTeamId && match.awayTeamId) {
      // Learn from the result using the pre-match input distributions.
      if (learningRate > 0 && pred) {
        const inputs = inputBreakdown(match, ctx);
        const step = gradientStep(weights, inputs, labelFromScore(match.score), learningRate);
        weights = step.weights;
        history.push({
          matchId: match.id,
          weights: { ...weights },
          brier: step.brier,
          timestamp: match.kickoff,
        });
      }
      ratings = applyResult(
        ratings,
        {
          homeId: match.homeTeamId,
          awayId: match.awayTeamId,
          homeGoals: match.score.home,
          awayGoals: match.score.away,
          importance: STAGE_IMPORTANCE[match.stage],
          neutral: true,
        },
        config,
      );
      finished.push(match);
    }
  }

  return { predictions, scored, ratings, weights, history };
}

export interface RatingPoint {
  step: number;
  rating: number;
  label: string;
}

/**
 * The Elo trajectory for one team: its rating after each finished match it
 * played, replayed from the seed so cross-results are reflected. Drives the
 * team page's strength chart.
 */
export function teamRatingTrajectory(
  matches: Match[],
  teamId: string,
  config: EloConfig = DEFAULT_ELO_CONFIG,
): RatingPoint[] {
  const ordered = matches
    .filter((m) => m.status === 'finished' && m.score && m.homeTeamId && m.awayTeamId)
    .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));

  let ratings: EloRatings = { ...ELO_SEED };
  const points: RatingPoint[] = [
    { step: 0, rating: ratingOf(ratings, teamId, config), label: 'Start' },
  ];
  let step = 0;

  for (const m of ordered) {
    ratings = applyResult(
      ratings,
      {
        homeId: m.homeTeamId as string,
        awayId: m.awayTeamId as string,
        homeGoals: (m.score as { home: number }).home,
        awayGoals: (m.score as { away: number }).away,
        importance: STAGE_IMPORTANCE[m.stage],
        neutral: true,
      },
      config,
    );
    if (m.homeTeamId === teamId || m.awayTeamId === teamId) {
      step += 1;
      points.push({ step, rating: Math.round(ratingOf(ratings, teamId, config)), label: m.id });
    }
  }

  return points;
}

/** Expose which inputs a match's prediction drew on (for the detail view). */
export function inputBreakdown(match: Match, ctx: PredictContext): InputDistributions {
  if (!match.homeTeamId || !match.awayTeamId) {
    return { elo: null, form: null, squad: null, polymarket: null, books: null };
  }
  const config = ctx.config ?? DEFAULT_ELO_CONFIG;
  return {
    elo: eloInput(match.homeTeamId, match.awayTeamId, ctx.ratings, config),
    form: formInput(match.homeTeamId, match.awayTeamId, ctx.form),
    squad: squadInput(match.homeTeamId, match.awayTeamId),
    polymarket: ctx.polymarket?.[match.id] ?? null,
    books: ctx.books?.[match.id] ?? null,
  };
}
