import type { MatchPrediction, ModelWeights } from '@/types/domain';
import type { InputDistributions, Outcome } from './types';
import { UNIFORM_OUTCOME, clamp01, normalizeOutcome } from './probability';

interface WeightedInput {
  outcome: Outcome;
  weight: number;
}

function presentInputs(inputs: InputDistributions, weights: ModelWeights): WeightedInput[] {
  const out: WeightedInput[] = [];
  if (inputs.elo) out.push({ outcome: inputs.elo, weight: weights.elo });
  if (inputs.form) out.push({ outcome: inputs.form, weight: weights.form });
  if (inputs.polymarket) out.push({ outcome: inputs.polymarket, weight: weights.polymarket });
  if (inputs.books) out.push({ outcome: inputs.books, weight: weights.books });
  return out;
}

/**
 * Weighted blend of the available input distributions. Weights are renormalized
 * over only the inputs that are present, so a missing market doesn't distort
 * the result — the model simply leans on what it has (Elo + form always).
 */
export function blendInputs(inputs: InputDistributions, weights: ModelWeights): Outcome {
  const present = presentInputs(inputs, weights);
  const wSum = present.reduce((s, w) => s + w.weight, 0);
  if (present.length === 0 || wSum <= 0) return { ...UNIFORM_OUTCOME };

  let h = 0;
  let d = 0;
  let a = 0;
  for (const { outcome, weight } of present) {
    const k = weight / wSum;
    h += outcome.homeWin * k;
    d += outcome.draw * k;
    a += outcome.awayWin * k;
  }
  return normalizeOutcome({ homeWin: h, draw: d, awayWin: a });
}

/**
 * Confidence band on each outcome probability. Wider when the inputs disagree
 * (high dispersion) and when fewer inputs are available (sparsity). The model
 * never claims a single hard number — this band is shown alongside it.
 */
export function predictionInterval(inputs: InputDistributions): number {
  const present = [inputs.elo, inputs.form, inputs.polymarket, inputs.books].filter(
    (o): o is Outcome => o != null,
  );
  const m = present.length;
  if (m === 0) return 0.2;

  const meanStdev =
    (['homeWin', 'draw', 'awayWin'] as const).reduce((acc, key) => {
      const vals = present.map((o) => o[key]);
      const mean = vals.reduce((s, v) => s + v, 0) / m;
      const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / m;
      return acc + Math.sqrt(variance);
    }, 0) / 3;

  const sparsity = ((4 - m) / 4) * 0.05;
  const spread = meanStdev * 0.9;
  const raw = 0.03 + sparsity + spread;
  return Math.round(clamp01(raw) * 1000) / 1000;
}

/** Assemble a final MatchPrediction from blended inputs plus an xG estimate. */
export function buildPrediction(
  matchId: string,
  inputs: InputDistributions,
  weights: ModelWeights,
  xg: { home: number; away: number },
  generatedAt: string,
): MatchPrediction {
  const blended = blendInputs(inputs, weights);
  return {
    matchId,
    homeWin: blended.homeWin,
    draw: blended.draw,
    awayWin: blended.awayWin,
    xgHome: Math.round(xg.home * 100) / 100,
    xgAway: Math.round(xg.away * 100) / 100,
    interval: predictionInterval(inputs),
    generatedAt,
  };
}
