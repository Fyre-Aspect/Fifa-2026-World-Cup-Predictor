/**
 * Scoreline model. The blended prediction gives outcome probabilities and an
 * expected-goals (xG) estimate for each side; this turns those expected goals
 * into an actual predicted scoreline by treating each team's goals as a Poisson
 * process. That's the standard, well-behaved way to go from "Portugal are
 * expected to score ~1.9" to "the single most likely result is 2–1".
 */

const MAX_GOALS = 8;

function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

/** Poisson probability mass: P(X = k) for a process with mean `lambda`. */
export function poisson(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

export interface Scoreline {
  home: number;
  away: number;
  /** Joint probability of exactly this scoreline. */
  prob: number;
}

/**
 * Joint scoreline probabilities up to MAX_GOALS each, as a flat list. Both
 * marginals are independent Poisson draws from the respective expected goals.
 */
export function scoreMatrix(xgHome: number, xgAway: number): Scoreline[] {
  const out: Scoreline[] = [];
  for (let h = 0; h <= MAX_GOALS; h++) {
    const ph = poisson(h, Math.max(0.05, xgHome));
    for (let a = 0; a <= MAX_GOALS; a++) {
      const pa = poisson(a, Math.max(0.05, xgAway));
      out.push({ home: h, away: a, prob: ph * pa });
    }
  }
  return out;
}

/** The single most probable exact scoreline. */
export function mostLikelyScore(xgHome: number, xgAway: number): Scoreline {
  const matrix = scoreMatrix(xgHome, xgAway);
  return matrix.reduce((best, s) => (s.prob > best.prob ? s : best));
}

/** The `n` most probable exact scorelines, most likely first. */
export function topScorelines(xgHome: number, xgAway: number, n = 4): Scoreline[] {
  return scoreMatrix(xgHome, xgAway)
    .sort((a, b) => b.prob - a.prob)
    .slice(0, n);
}

/**
 * Home / draw / away probabilities implied purely by the Poisson scoreline grid.
 * Used as a sanity cross-check against the blended outcome model.
 */
export function outcomeFromXg(xgHome: number, xgAway: number): {
  homeWin: number;
  draw: number;
  awayWin: number;
} {
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  for (const s of scoreMatrix(xgHome, xgAway)) {
    if (s.home > s.away) homeWin += s.prob;
    else if (s.home < s.away) awayWin += s.prob;
    else draw += s.prob;
  }
  const total = homeWin + draw + awayWin || 1;
  return { homeWin: homeWin / total, draw: draw / total, awayWin: awayWin / total };
}

/** Probability the match has more than 2.5 total goals — a common over/under line. */
export function overProbability(xgHome: number, xgAway: number, line = 2.5): number {
  let over = 0;
  for (const s of scoreMatrix(xgHome, xgAway)) {
    if (s.home + s.away > line) over += s.prob;
  }
  return over;
}

/** Render a scoreline from one team's perspective, e.g. "2–1". */
export function formatScoreline(s: Scoreline): string {
  return `${s.home}–${s.away}`;
}
