import type { Outcome } from './types';

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export const UNIFORM_OUTCOME: Outcome = { homeWin: 1 / 3, draw: 1 / 3, awayWin: 1 / 3 };

/** Renormalize an outcome so its three probabilities sum to 1. */
export function normalizeOutcome(o: Outcome): Outcome {
  const sum = o.homeWin + o.draw + o.awayWin;
  if (!Number.isFinite(sum) || sum <= 0) return { ...UNIFORM_OUTCOME };
  return { homeWin: o.homeWin / sum, draw: o.draw / sum, awayWin: o.awayWin / sum };
}

/**
 * Convert a strength difference in Elo points (home minus away, home advantage
 * already folded in) into a home/draw/away distribution. The draw share peaks
 * when the sides are even and shrinks as the gap widens — a simple, monotonic
 * model that keeps the three probabilities summing to exactly 1.
 */
export function outcomeFromEloDiff(diff: number, drawBase = 0.28): Outcome {
  const e = 1 / (1 + Math.pow(10, -diff / 400));
  const draw = drawBase * (1 - Math.abs(2 * e - 1));
  const homeWin = e * (1 - draw);
  const awayWin = (1 - e) * (1 - draw);
  return { homeWin, draw, awayWin };
}

/** The single most likely label of an outcome. */
export function argmaxOutcome(o: Outcome): 'home' | 'draw' | 'away' {
  if (o.homeWin >= o.draw && o.homeWin >= o.awayWin) return 'home';
  if (o.awayWin >= o.draw && o.awayWin >= o.homeWin) return 'away';
  return 'draw';
}
