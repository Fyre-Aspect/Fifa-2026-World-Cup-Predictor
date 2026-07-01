import type {
  Match,
  MatchPrediction,
  MatchScore,
  MatchStage,
  ModelWeights,
  Team,
} from '@/types/domain';
import type { EloRatings } from '@/model/elo';
import { buildFormTable } from '@/model/form';
import { predictMatch } from '@/model/predict';
import { mostLikelyDecisiveScore, type Scoreline } from '@/model/scoreline';
import { R32_POSITIONS, slotLabel } from './bracketSkeleton';
import { projectedR32Matches } from './projectedBracket';

/**
 * Resolves the knockout bracket from live data. It is *results-first*: wherever
 * the feed has already played (or drawn) a knockout tie, the bracket uses the
 * real matchup and advances the team that actually won — so Germany going out to
 * Paraguay on penalties moves Paraguay on, never Germany. Only genuinely
 * undecided ties are filled by the model (in the projected view), all the way to
 * a projected champion; the official view leaves them open.
 *
 * Rounds follow the **official FIFA 2026 bracket tree**, not left-to-right
 * adjacency: each later match is fed by two specific earlier matches, and the
 * two halves only cross at the semi-finals. The feeder maps index into the
 * canonical match order (R32 = matches 73–88, R16 = 89–96, QF = 97–100).
 */
const R16_FEEDERS: ReadonlyArray<readonly [number, number]> = [
  [1, 4], // 89: W74 v W77
  [0, 2], // 90: W73 v W75
  [3, 5], // 91: W76 v W78
  [6, 7], // 92: W79 v W80
  [10, 11], // 93: W83 v W84
  [8, 9], // 94: W81 v W82
  [13, 15], // 95: W86 v W88
  [12, 14], // 96: W85 v W87
];
const QF_FEEDERS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], // 97: W89 v W90
  [4, 5], // 98: W93 v W94
  [2, 3], // 99: W91 v W92
  [6, 7], // 100: W95 v W96
];
const SF_FEEDERS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], // 101: W97 v W98
  [2, 3], // 102: W99 v W100
];

export interface ProjectedTie {
  id: string;
  stage: MatchStage;
  kickoff: string;
  cityId: string;
  homeId: string | null;
  awayId: string | null;
  /** Position label (e.g. "Runner-up A") shown when a slot has no team yet. */
  homeLabel?: string | null;
  awayLabel?: string | null;
  prediction: MatchPrediction | null;
  /** Shown score: the real result when played, else the projected decisive line. */
  scoreline: Scoreline | null;
  winnerId: string | null;
  /** True when the tie was (or is projected to be) decided in ET / on penalties. */
  aet: boolean;
  /** A real, finished result is in place — this is not a projection. */
  played: boolean;
  /** The real tie is in progress. */
  live: boolean;
  /** Penalty-shootout score, when the real tie went to penalties. */
  penalties: MatchScore | null;
}

export interface ProjectedKnockouts {
  round32: ProjectedTie[];
  round16: ProjectedTie[];
  quarter: ProjectedTie[];
  semi: ProjectedTie[];
  final: ProjectedTie | null;
  third: ProjectedTie | null;
  championId: string | null;
}

export interface ProjectOptions {
  /**
   * Fill undecided ties (and advance) with model predictions. True for the
   * projected forecast; false for the official view, which only reflects real
   * results and leaves the rest open.
   */
  predict?: boolean;
}

function loserOf(tie: ProjectedTie): string | null {
  if (!tie.winnerId) return null;
  return tie.winnerId === tie.homeId ? tie.awayId : tie.homeId;
}

/** Order-independent key for a fixture's two teams. */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function projectKnockouts(
  matches: Match[],
  teams: Record<string, Team>,
  ratings: EloRatings,
  weights: ModelWeights,
  storedPredictions: Record<string, MatchPrediction>,
  options: ProjectOptions = {},
): ProjectedKnockouts {
  const predict = options.predict ?? true;
  const form = buildFormTable(matches);
  const ctx = { ratings, form, weights };
  const now = new Date().toISOString();

  // Canonical Round of 32: the real official draw when the feed has published it
  // (carrying real matchups + scores), otherwise seeded onto the FIFA skeleton.
  const r32Seed = projectedR32Matches(matches, teams, ratings);

  // Every knockout fixture that has both teams, keyed by unordered pair, so a tie
  // computed from feeder winners can pick up the real matchup and its result —
  // even before the feed populates that later-round slot itself.
  const KO: ReadonlyArray<MatchStage> = ['round32', 'round16', 'quarter', 'semi', 'third', 'final'];
  const fixtureByPair = new Map<string, Match>();
  for (const m of matches) {
    if (KO.includes(m.stage) && m.homeTeamId && m.awayTeamId) {
      fixtureByPair.set(pairKey(m.homeTeamId, m.awayTeamId), m);
    }
  }

  function predictionFor(
    id: string,
    stage: MatchStage,
    kickoff: string,
    cityId: string,
    homeId: string,
    awayId: string,
  ): MatchPrediction {
    return (
      storedPredictions[id] ??
      predictMatch(
        {
          id,
          stage,
          group: null,
          kickoff,
          cityId,
          homeTeamId: homeId,
          awayTeamId: awayId,
          status: 'scheduled',
          score: null,
          minute: null,
        },
        ctx,
        now,
      )
    );
  }

  function tie(
    stage: MatchStage,
    fallbackId: string,
    homeId: string | null,
    awayId: string | null,
    labels?: readonly [string, string],
  ): ProjectedTie {
    const real = homeId && awayId ? fixtureByPair.get(pairKey(homeId, awayId)) : undefined;
    const id = real?.id ?? fallbackId;
    const kickoff = real?.kickoff ?? now;
    const cityId = real?.cityId ?? '';

    // Orient a real fixture's score to our (homeId, awayId) order; winner is a
    // team id, so it needs no flipping.
    const flip = real ? real.homeTeamId !== homeId : false;
    const orient = (sc: MatchScore | null | undefined): MatchScore | null =>
      sc ? { home: flip ? sc.away : sc.home, away: flip ? sc.home : sc.away } : null;
    const realWinnerId = real
      ? real.winner === 'home'
        ? real.homeTeamId
        : real.winner === 'away'
          ? real.awayTeamId
          : real.score
            ? real.score.home > real.score.away
              ? real.homeTeamId
              : real.score.away > real.score.home
                ? real.awayTeamId
                : null
            : null
      : null;

    const base: ProjectedTie = {
      id,
      stage,
      kickoff,
      cityId,
      homeId,
      awayId,
      homeLabel: labels?.[0] ?? null,
      awayLabel: labels?.[1] ?? null,
      prediction: null,
      scoreline: null,
      winnerId: null,
      aet: false,
      played: false,
      live: false,
      penalties: null,
    };

    // 1) Real finished result — authoritative, shown in every view.
    if (real && real.status === 'finished' && real.score) {
      const os = orient(real.score);
      return {
        ...base,
        scoreline: os ? { ...os, prob: 1 } : null,
        winnerId: realWinnerId,
        aet: real.aet ?? false,
        penalties: orient(real.penalties),
        played: true,
      };
    }

    // 2) Real tie in progress — show the live score; advance the leader (or, when
    //    projecting and level, the model's pick) so the tree can still resolve.
    if (real && real.status === 'live' && real.score && homeId && awayId) {
      const os = orient(real.score);
      let winnerId = realWinnerId; // current leader, if any
      let prediction: MatchPrediction | null = null;
      if (predict) {
        prediction = predictionFor(id, stage, kickoff, cityId, homeId, awayId);
        if (!winnerId) winnerId = prediction.homeWin >= prediction.awayWin ? homeId : awayId;
      }
      return {
        ...base,
        prediction,
        scoreline: os ? { ...os, prob: 1 } : null,
        winnerId,
        live: true,
      };
    }

    // 3) Undecided but both teams known — project it (forecast view only).
    if (predict && homeId && awayId) {
      const prediction = predictionFor(id, stage, kickoff, cityId, homeId, awayId);
      const homeWins = prediction.homeWin >= prediction.awayWin;
      return {
        ...base,
        prediction,
        winnerId: homeWins ? homeId : awayId,
        scoreline: mostLikelyDecisiveScore(prediction.xgHome, prediction.xgAway, homeWins),
        aet: prediction.draw >= prediction.homeWin && prediction.draw >= prediction.awayWin,
      };
    }

    // 4) Official view, or a slot still awaiting its teams — leave it open.
    return base;
  }

  // Round of 32 in canonical order (the seed supplies the matchup; `tie` fetches
  // any real result for it and keeps the fixed group-position labels).
  const round32 = R32_POSITIONS.map(([homeCode, awayCode], i) => {
    const seed = r32Seed[i];
    return tie(
      'round32',
      `R32-${i + 1}`,
      seed?.homeTeamId ?? null,
      seed?.awayTeamId ?? null,
      [slotLabel(homeCode), slotLabel(awayCode)],
    );
  });

  const round16 = R16_FEEDERS.map(([a, b], i) =>
    tie('round16', `R16-${i + 1}`, round32[a]?.winnerId ?? null, round32[b]?.winnerId ?? null),
  );

  const quarter = QF_FEEDERS.map(([a, b], i) =>
    tie('quarter', `QF-${i + 1}`, round16[a]?.winnerId ?? null, round16[b]?.winnerId ?? null),
  );

  const semi = SF_FEEDERS.map(([a, b], i) =>
    tie('semi', `SF-${i + 1}`, quarter[a]?.winnerId ?? null, quarter[b]?.winnerId ?? null),
  );

  const final = tie('final', 'FIN', semi[0]?.winnerId ?? null, semi[1]?.winnerId ?? null);
  const third = tie('third', 'TP', loserOf(semi[0]), loserOf(semi[1]));

  return {
    round32,
    round16,
    quarter,
    semi,
    final,
    third,
    championId: final.winnerId,
  };
}
