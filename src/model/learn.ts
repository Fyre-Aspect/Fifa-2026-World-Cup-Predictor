import type { ModelWeights } from '@/types/domain';
import type { InputDistributions, Outcome } from './types';
import { blendInputs } from './blend';
import { brierScore, type OutcomeLabel } from './scoring';

const KEYS: Array<keyof ModelWeights> = ['elo', 'form', 'polymarket', 'books'];
const MIN_WEIGHT = 0.01;

function oneHot(actual: OutcomeLabel): Outcome {
  return {
    homeWin: actual === 'home' ? 1 : 0,
    draw: actual === 'draw' ? 1 : 0,
    awayWin: actual === 'away' ? 1 : 0,
  };
}

export interface LearnStep {
  weights: ModelWeights;
  /** Blended Brier score of the prediction that drove this update. */
  brier: number;
  /** Per-input Brier (lower = that input was more correct this match). */
  perInputBrier: Partial<Record<keyof ModelWeights, number>>;
}

/**
 * One gradient step of post-match learning. After a finished match we measure
 * how the blended prediction did (Brier) and nudge each present input's weight
 * down its share of the error gradient — so inputs that pointed at the actual
 * result gain weight and inputs that pointed away lose it. Weights are kept on
 * the simplex (non-negative, summing to 1).
 *
 * Pure and deterministic, which makes the learning curve replayable and testable.
 */
export function gradientStep(
  weights: ModelWeights,
  inputs: InputDistributions,
  actual: OutcomeLabel,
  learningRate = 0.04,
): LearnStep {
  const blended = blendInputs(inputs, weights);
  const y = oneHot(actual);
  const errHome = blended.homeWin - y.homeWin;
  const errDraw = blended.draw - y.draw;
  const errAway = blended.awayWin - y.awayWin;

  const next: ModelWeights = { ...weights };
  const perInputBrier: Partial<Record<keyof ModelWeights, number>> = {};

  for (const key of KEYS) {
    const inp = inputs[key];
    if (!inp) continue;
    // d(Brier)/d(w_key) ≈ 2 * Σ_o (p_o - y_o) * p_key,o
    const grad = 2 * (errHome * inp.homeWin + errDraw * inp.draw + errAway * inp.awayWin);
    next[key] = Math.max(MIN_WEIGHT, weights[key] - learningRate * grad);
    perInputBrier[key] = brierScore(inp, actual);
  }

  // Renormalize across all four so the weights stay a distribution.
  const total = KEYS.reduce((s, k) => s + next[k], 0);
  if (total > 0) {
    for (const key of KEYS) next[key] = next[key] / total;
  }

  return { weights: next, brier: brierScore(blended, actual), perInputBrier };
}
