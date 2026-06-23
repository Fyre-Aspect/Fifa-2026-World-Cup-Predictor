/** A probability distribution over the three match outcomes (home view). */
export interface Outcome {
  homeWin: number;
  draw: number;
  awayWin: number;
}

/** Named model inputs, each a full outcome distribution (or null if missing). */
export interface InputDistributions {
  elo: Outcome | null;
  form: Outcome | null;
  polymarket: Outcome | null;
  books: Outcome | null;
}

/** Implied de-vigged probabilities pulled from a market, keyed by match id. */
export type MarketTable = Record<string, Outcome>;
