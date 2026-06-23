/**
 * Elo engine for international football, in the eloratings.net style: a base
 * K-factor scaled by match importance and by goal difference. Pure and
 * immutable — every update returns a fresh ratings map, which makes the model
 * easy to unit-test and to replay match-by-match for the learning view.
 */

export type EloRatings = Record<string, number>;

export interface EloConfig {
  /** Base K-factor (World Cup matches sit around 40–60). */
  k: number;
  /** Home-advantage bonus in Elo points, applied to the designated home side. */
  homeAdvantage: number;
  /** Rating assigned to a team with no prior history. */
  defaultRating: number;
}

export const DEFAULT_ELO_CONFIG: EloConfig = {
  k: 45,
  homeAdvantage: 65,
  defaultRating: 1700,
};

export interface EloMatchResult {
  homeId: string;
  awayId: string;
  homeGoals: number;
  awayGoals: number;
  /** Stage importance multiplier (group ~1.0, final higher). */
  importance?: number;
  /** True for neutral venues — suppresses the home-advantage bonus. */
  neutral?: boolean;
}

export function ratingOf(ratings: EloRatings, id: string, config: EloConfig): number {
  return ratings[id] ?? config.defaultRating;
}

/** Expected score (win probability share) for the home side, in [0, 1]. */
export function expectedHomeScore(
  ratingHome: number,
  ratingAway: number,
  homeAdvantage: number,
): number {
  return 1 / (1 + Math.pow(10, -(ratingHome + homeAdvantage - ratingAway) / 400));
}

/** eloratings.net goal-difference weighting. */
export function goalDifferenceFactor(goalDiff: number): number {
  const gd = Math.abs(goalDiff);
  if (gd <= 1) return 1;
  if (gd === 2) return 1.5;
  return (11 + gd) / 8;
}

function actualScore(homeGoals: number, awayGoals: number): number {
  if (homeGoals > awayGoals) return 1;
  if (homeGoals < awayGoals) return 0;
  return 0.5;
}

/** Apply one result, returning a new ratings map (inputs untouched). */
export function applyResult(
  ratings: EloRatings,
  result: EloMatchResult,
  config: EloConfig = DEFAULT_ELO_CONFIG,
): EloRatings {
  const ratingHome = ratingOf(ratings, result.homeId, config);
  const ratingAway = ratingOf(ratings, result.awayId, config);
  const ha = result.neutral ? 0 : config.homeAdvantage;

  const expected = expectedHomeScore(ratingHome, ratingAway, ha);
  const actual = actualScore(result.homeGoals, result.awayGoals);
  const importance = result.importance ?? 1;
  const g = goalDifferenceFactor(result.homeGoals - result.awayGoals);
  const delta = config.k * importance * g * (actual - expected);

  return {
    ...ratings,
    [result.homeId]: ratingHome + delta,
    [result.awayId]: ratingAway - delta,
  };
}

/** Fold a chronological list of results into a final ratings map. */
export function applyResults(
  initial: EloRatings,
  results: EloMatchResult[],
  config: EloConfig = DEFAULT_ELO_CONFIG,
): EloRatings {
  return results.reduce((acc, r) => applyResult(acc, r, config), { ...initial });
}
