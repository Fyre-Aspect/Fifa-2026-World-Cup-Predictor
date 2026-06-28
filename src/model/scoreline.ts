/**
 * Scoreline model. The blended prediction gives outcome probabilities and an
 * expected-goals (xG) estimate for each side; this turns those expected goals
 * into an actual predicted scoreline by treating each team's goals as a Poisson
 * process. The user-facing prediction (`predictedScoreline`) draws one plausible
 * result from those Poissons — seeded per match — so the fixture list shows the
 * real spread of scores (including high-scoring games) instead of a wall of low
 * modal results; the raw mode and the full grid remain for the probability views.
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

/** The single most probable exact scoreline (the mode of the joint grid). */
export function mostLikelyScore(xgHome: number, xgAway: number): Scoreline {
  const matrix = scoreMatrix(xgHome, xgAway);
  return matrix.reduce((best, s) => (s.prob > best.prob ? s : best));
}

/**
 * Deterministic RNG (mulberry32) seeded from a string. Seeding per match keeps a
 * game's predicted scoreline stable across renders while letting it differ from
 * match to match.
 */
function seededRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One Poisson(lambda) draw via Knuth's algorithm, clamped to MAX_GOALS. */
function samplePoisson(lambda: number, rng: () => number): number {
  const L = Math.exp(-Math.max(0.05, lambda));
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rng();
  } while (p > L && k <= MAX_GOALS + 1);
  return Math.min(MAX_GOALS, k - 1);
}

/**
 * The scoreline we show as "the prediction". Returning the mean (or the Poisson
 * mode) collapses nearly every game onto 1–0/2–1; instead we draw one plausible
 * result from each side's Poisson, seeded by the match so it's stable. Across the
 * fixture list this gives the real spread of football — plenty of tight games,
 * but also the 3–2s, 4–1s and the occasional 5–3, with favourites posting the
 * odd hat-trick — rather than a wall of identical low scores.
 */
export function predictedScoreline(xgHome: number, xgAway: number, seed = ''): Scoreline {
  const rng = seededRng(seed || `${xgHome.toFixed(2)}:${xgAway.toFixed(2)}`);
  const home = samplePoisson(xgHome, rng);
  const away = samplePoisson(xgAway, rng);
  return {
    home,
    away,
    prob: poisson(home, Math.max(0.05, xgHome)) * poisson(away, Math.max(0.05, xgAway)),
  };
}

/**
 * The most probable *decisive* scoreline in which a chosen side wins. Used for
 * knockout ties, where a draw can't be the final result — someone has to
 * advance. Conditioning on the winner this way yields varied, sensible scores
 * (1–0, 2–1, 2–0, …) instead of collapsing every even tie onto 1–1. The
 * returned scoreline is always oriented home–away; `homeWins` picks which side
 * comes out on top.
 */
export function mostLikelyDecisiveScore(
  xgHome: number,
  xgAway: number,
  homeWins: boolean,
): Scoreline {
  const decisive = scoreMatrix(xgHome, xgAway).filter((s) =>
    homeWins ? s.home > s.away : s.away > s.home,
  );
  // Fallback to a minimal 1–0 win if the grid somehow had no decisive cell.
  if (decisive.length === 0) {
    return homeWins ? { home: 1, away: 0, prob: 0 } : { home: 0, away: 1, prob: 0 };
  }
  return decisive.reduce((best, s) => (s.prob > best.prob ? s : best));
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
