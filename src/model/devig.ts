import type { Outcome } from './types';
import { UNIFORM_OUTCOME } from './probability';

/**
 * De-vigging utilities. Bookmaker and prediction-market prices include a margin
 * (the "vig" / "overround") so the implied probabilities sum to more than 1.
 * We remove it with the simple proportional (normalization) method, which is
 * adequate for blending and keeps the math transparent.
 */

export function impliedFromDecimal(decimalOdds: number): number {
  if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) return 0;
  return 1 / decimalOdds;
}

/** Proportional de-vig: scale raw implied probabilities to sum to 1. */
export function deVig(rawImplied: number[]): number[] {
  const sum = rawImplied.reduce((a, b) => a + Math.max(0, b), 0);
  if (sum <= 0) return rawImplied.map(() => 1 / rawImplied.length);
  return rawImplied.map((p) => Math.max(0, p) / sum);
}

/** De-vig a 3-way (home/draw/away) market given decimal odds. */
export function deVigThreeWay(homeOdds: number, drawOdds: number, awayOdds: number): Outcome {
  const [h, d, a] = deVig([
    impliedFromDecimal(homeOdds),
    impliedFromDecimal(drawOdds),
    impliedFromDecimal(awayOdds),
  ]);
  if (h === undefined || d === undefined || a === undefined) return { ...UNIFORM_OUTCOME };
  return { homeWin: h, draw: d, awayWin: a };
}

/**
 * De-vig a 2-way (home/away, no draw) market and fold in a prior draw rate so
 * it becomes a 3-way outcome. Used for moneyline-style markets that omit the
 * draw — common on prediction markets.
 */
export function deVigTwoWayWithDraw(
  homeOdds: number,
  awayOdds: number,
  drawPrior = 0.26,
): Outcome {
  const [h, a] = deVig([impliedFromDecimal(homeOdds), impliedFromDecimal(awayOdds)]);
  const hh = h ?? 0.5;
  const aa = a ?? 0.5;
  return {
    homeWin: hh * (1 - drawPrior),
    draw: drawPrior,
    awayWin: aa * (1 - drawPrior),
  };
}

/** De-vig a list of implied probabilities from any N-way market. */
export function deVigProbabilities(implied: number[]): number[] {
  return deVig(implied);
}
