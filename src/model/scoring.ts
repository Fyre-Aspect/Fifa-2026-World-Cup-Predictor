import type { MatchScore } from '@/types/domain';
import type { Outcome } from './types';

export type OutcomeLabel = 'home' | 'draw' | 'away';

export function labelFromScore(score: MatchScore): OutcomeLabel {
  if (score.home > score.away) return 'home';
  if (score.home < score.away) return 'away';
  return 'draw';
}

function oneHot(label: OutcomeLabel): Outcome {
  return {
    homeWin: label === 'home' ? 1 : 0,
    draw: label === 'draw' ? 1 : 0,
    awayWin: label === 'away' ? 1 : 0,
  };
}

function probFor(pred: Outcome, label: OutcomeLabel): number {
  if (label === 'home') return pred.homeWin;
  if (label === 'away') return pred.awayWin;
  return pred.draw;
}

/**
 * Multiclass Brier score for one prediction: the summed squared error between
 * the predicted distribution and the one-hot actual. Range 0 (perfect) to 2.
 */
export function brierScore(pred: Outcome, actual: OutcomeLabel): number {
  const y = oneHot(actual);
  return (
    (pred.homeWin - y.homeWin) ** 2 +
    (pred.draw - y.draw) ** 2 +
    (pred.awayWin - y.awayWin) ** 2
  );
}

/** Multiclass log loss for one prediction (natural log, clamped). */
export function logLoss(pred: Outcome, actual: OutcomeLabel): number {
  const p = Math.min(1, Math.max(1e-12, probFor(pred, actual)));
  return -Math.log(p);
}

export interface ScoredPrediction {
  pred: Outcome;
  actual: OutcomeLabel;
}

export interface AccuracySummary {
  scoredMatches: number;
  meanBrier: number;
  meanLogLoss: number;
}

export function summarizeAccuracy(scored: ScoredPrediction[]): AccuracySummary {
  if (scored.length === 0) return { scoredMatches: 0, meanBrier: 0, meanLogLoss: 0 };
  let brier = 0;
  let ll = 0;
  for (const s of scored) {
    brier += brierScore(s.pred, s.actual);
    ll += logLoss(s.pred, s.actual);
  }
  return {
    scoredMatches: scored.length,
    meanBrier: brier / scored.length,
    meanLogLoss: ll / scored.length,
  };
}

export interface CalibrationBin {
  /** Bin midpoint (predicted probability). */
  binMid: number;
  /** Mean predicted probability of the chosen outcome in this bin. */
  predicted: number;
  /** Observed frequency that the chosen outcome occurred. */
  observed: number;
  count: number;
}

/**
 * Reliability/calibration over the model's most-confident pick per match: bin
 * predictions by the probability assigned to their argmax outcome, then compare
 * predicted probability to observed frequency. A well-calibrated model sits on
 * the diagonal.
 */
export function calibrationBins(scored: ScoredPrediction[], bins = 5): CalibrationBin[] {
  const buckets = Array.from({ length: bins }, () => ({ pSum: 0, hit: 0, count: 0 }));

  for (const { pred, actual } of scored) {
    const entries: Array<[OutcomeLabel, number]> = [
      ['home', pred.homeWin],
      ['draw', pred.draw],
      ['away', pred.awayWin],
    ];
    entries.sort((a, b) => b[1] - a[1]);
    const [pickLabel, pickProb] = entries[0];
    // Predicted-class probabilities live in [1/3, 1]; map that into bins.
    const t = Math.min(0.999, Math.max(0, (pickProb - 1 / 3) / (1 - 1 / 3)));
    const idx = Math.min(bins - 1, Math.floor(t * bins));
    buckets[idx].pSum += pickProb;
    buckets[idx].hit += pickLabel === actual ? 1 : 0;
    buckets[idx].count += 1;
  }

  return buckets.map((b, i) => ({
    binMid: (i + 0.5) / bins,
    predicted: b.count > 0 ? b.pSum / b.count : 0,
    observed: b.count > 0 ? b.hit / b.count : 0,
    count: b.count,
  }));
}
