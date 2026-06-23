/**
 * Display formatting. Per the honesty rules, outcome probabilities are never
 * shown with more than one decimal place — extra precision would imply a
 * certainty the model does not have.
 */

/** A probability in [0,1] as a one-decimal percentage, e.g. "54.1%". */
export function formatProbability(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

/** A confidence band in probability points, e.g. "±6". */
export function formatInterval(interval: number): string {
  return `±${Math.round(interval * 100)}`;
}

/** Whole-number percent, used for weights (not predictions). */
export function formatWeight(p: number): string {
  return `${Math.round(p * 100)}%`;
}

/** Expected goals to one decimal. */
export function formatXg(xg: number): string {
  return xg.toFixed(1);
}

/** A signed Elo delta, e.g. "+12" / "−7". */
export function formatEloDelta(delta: number): string {
  const rounded = Math.round(delta);
  if (rounded === 0) return '0';
  return rounded > 0 ? `+${rounded}` : `−${Math.abs(rounded)}`;
}
