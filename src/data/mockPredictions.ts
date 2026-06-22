import type { Match, MatchPrediction } from '@/types/domain';

/**
 * Placeholder predictions used while the real model is being built (commit 4).
 * They come from a tiny Elo-style strength table so the numbers are plausible
 * and internally consistent — but they are stand-ins, replaced wholesale once
 * the Elo + form + market model exists. Everything stays labeled as a model
 * estimate, so nothing here is presented as fact.
 */
const STRENGTH: Record<string, number> = {
  ARG: 2100, FRA: 2080, BRA: 2050, ENG: 2000, ESP: 1990, POR: 1970,
  NED: 1960, GER: 1955, BEL: 1940, CRO: 1930, URU: 1900, MAR: 1850,
  SEN: 1830, USA: 1820, MEX: 1810, JPN: 1800,
};

const HOME_ADVANTAGE = 60;
const DEFAULT_STRENGTH = 1850;

function strengthOf(id: string | null): number {
  if (!id) return DEFAULT_STRENGTH;
  return STRENGTH[id] ?? DEFAULT_STRENGTH;
}

export function mockPredictionFor(match: Match): MatchPrediction | null {
  if (!match.homeTeamId || !match.awayTeamId) return null;

  const diff = strengthOf(match.homeTeamId) + HOME_ADVANTAGE - strengthOf(match.awayTeamId);
  // Expected points share for the home side.
  const e = 1 / (1 + Math.pow(10, -diff / 400));
  const draw = 0.28 * (1 - Math.abs(2 * e - 1));
  const homeWin = e * (1 - draw);
  const awayWin = (1 - e) * (1 - draw);

  const xgHome = Math.max(0.3, 1.3 * Math.exp(diff / 600));
  const xgAway = Math.max(0.3, 1.3 * Math.exp(-diff / 600));

  return {
    matchId: match.id,
    homeWin,
    draw,
    awayWin,
    xgHome: Math.round(xgHome * 100) / 100,
    xgAway: Math.round(xgAway * 100) / 100,
    interval: 0.06,
    generatedAt: new Date().toISOString(),
  };
}

export function buildMockPredictions(matches: Match[]): Record<string, MatchPrediction> {
  const out: Record<string, MatchPrediction> = {};
  for (const match of matches) {
    const pred = mockPredictionFor(match);
    if (pred) out[match.id] = pred;
  }
  return out;
}
