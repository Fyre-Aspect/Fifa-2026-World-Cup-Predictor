/**
 * Core domain types for GroupStage.
 *
 * These describe the app's internal, already-validated shapes. Anything that
 * crosses an API boundary is parsed with Zod first (see src/api/schemas.ts)
 * and then mapped into these types — never trust a raw response shape.
 */

export type ConfederationCode =
  | 'UEFA'
  | 'CONMEBOL'
  | 'CONCACAF'
  | 'CAF'
  | 'AFC'
  | 'OFC';

export interface Team {
  /** Stable internal id, usually the FIFA/ISO trigram, e.g. "ARG". */
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2, lower-cased, for flag CDN lookups, e.g. "ar". */
  flagCode: string;
  confederation: ConfederationCode;
  /** Primary and secondary kit colors as hex, used for procedural jerseys. */
  colors: {
    primary: string;
    secondary: string;
  };
  /** Group letter A–L, or null once into the knockout phase. */
  group: string | null;
}

export interface HostCity {
  id: string;
  name: string;
  country: 'USA' | 'CAN' | 'MEX';
  /** Latitude / longitude in degrees for globe pin placement. */
  lat: number;
  lon: number;
  /** Stadium name. */
  venue: string;
}

export type MatchStage =
  | 'group'
  | 'round32'
  | 'round16'
  | 'quarter'
  | 'semi'
  | 'third'
  | 'final';

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface MatchScore {
  home: number;
  away: number;
}

export interface Match {
  id: string;
  stage: MatchStage;
  /** Group letter for group-stage matches, else null. */
  group: string | null;
  /** Kickoff time, ISO 8601 UTC. */
  kickoff: string;
  cityId: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  status: MatchStatus;
  /** Live or final score; null before kickoff. */
  score: MatchScore | null;
  /** Live clock in minutes when status === 'live'. */
  minute: number | null;
}

/**
 * A probability distribution over the three match outcomes plus expected
 * goals. Probabilities always sum to 1. `interval` is a +/- band on each
 * outcome probability — the model never claims a single hard number.
 */
export interface MatchPrediction {
  matchId: string;
  /** Outcome probabilities from the home team's perspective. Sum to 1. */
  homeWin: number;
  draw: number;
  awayWin: number;
  /** Expected goals for each side. */
  xgHome: number;
  xgAway: number;
  /** Symmetric uncertainty band applied to each outcome probability. */
  interval: number;
  /** When this prediction was produced (ISO 8601). */
  generatedAt: string;
}

/** The five weighted model inputs. Always sum to 1. */
export interface ModelWeights {
  elo: number;
  form: number;
  /** Squad quality from player ratings + the leagues they play in. */
  squad: number;
  polymarket: number;
  books: number;
}

/** A single recorded learning step after a finished match. */
export interface WeightSnapshot {
  /** Match that triggered the update; null for the initial seed. */
  matchId: string | null;
  weights: ModelWeights;
  /** Brier score of the prediction that triggered this update. */
  brier: number | null;
  timestamp: string;
}

/** Accuracy accounting over all scored predictions so far. */
export interface ModelAccuracy {
  scoredMatches: number;
  /** Running mean Brier score (lower is better, 0..2). */
  meanBrier: number;
  /** Running mean multiclass log loss (lower is better). */
  meanLogLoss: number;
}

export type ViewId = 'globe' | 'bracket' | 'match' | 'team' | 'dashboard';
