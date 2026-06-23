import { ELO_SEED } from './eloSeed';
import { SQUADS, type Player } from '@/data/squads';

/**
 * Squad strength: a single 70–92 ability index per team, derived from the
 * players in src/data/squads.ts. The league a player earns his football in is
 * treated as an additive adjustment on his raw rating — the same number is
 * worth more when it's proven weekly in a stronger competition. Teams without a
 * curated squad fall back to an Elo-derived rating on the same scale, so every
 * side still gets a strength (and therefore a score).
 */

/**
 * Additive rating adjustment by domestic league. Top-5 European leagues lift a
 * player's effective rating; softer or developmental leagues discount it.
 * Anything unlisted is treated as neutral-minus.
 */
export const LEAGUE_STRENGTH: Record<string, number> = {
  'Premier League': 2.5,
  'La Liga': 2.0,
  'Serie A': 1.5,
  Bundesliga: 1.5,
  'Ligue 1': 1.0,
  Eredivisie: -0.5,
  'Primeira Liga': -0.5,
  'Süper Lig': -1.0,
  'Saudi Pro League': -2.5,
  MLS: -2.5,
  'Liga MX': -2.0,
  'J1 League': -2.0,
  'K League': -3.0,
  'Série A (BRA)': -1.0,
  'Russian Premier League': -2.5,
  'Super League': -3.5,
  'Segunda División': -4.0,
  'Uzbek Super League': -6.0,
};

const POSITION_WEIGHT: Record<Player['position'], number> = {
  GK: 0.85,
  DF: 0.95,
  MF: 1.05,
  FW: 1.1,
};

/** Effective rating for one player: raw rating + league adjustment. */
export function effectiveRating(p: Player): number {
  return p.rating + (LEAGUE_STRENGTH[p.league] ?? -1.5);
}

// Fit so a ~2100 Elo side lands ~87 and a ~1600 side ~73 on the rating scale.
const ELO_TO_RATING_SLOPE = 0.028;
const ELO_TO_RATING_BASE = 28.2;
/** Rating points are worth this many Elo points when blended into outcomes. */
export const SQUAD_ELO_PER_POINT = 1 / ELO_TO_RATING_SLOPE; // ≈ 35.7

function eloDerivedRating(teamId: string): number {
  const elo = ELO_SEED[teamId.toUpperCase()] ?? 1500;
  return ELO_TO_RATING_BASE + ELO_TO_RATING_SLOPE * elo;
}

export function hasSquad(teamId: string | null | undefined): boolean {
  return !!teamId && teamId.toUpperCase() in SQUADS;
}

/**
 * Position-weighted, league-adjusted mean rating of a team's key players, or an
 * Elo-derived rating when no squad is curated. Always finite; range ~70–92.
 */
export function squadStrength(teamId: string | null | undefined): number {
  if (!teamId) return eloDerivedRating('___');
  const squad = SQUADS[teamId.toUpperCase()];
  if (!squad || squad.length === 0) return eloDerivedRating(teamId);

  let weighted = 0;
  let weight = 0;
  for (const p of squad) {
    const w = POSITION_WEIGHT[p.position];
    weighted += effectiveRating(p) * w;
    weight += w;
  }
  return weight > 0 ? weighted / weight : eloDerivedRating(teamId);
}

/** Plain mean of raw player ratings (no league/position weighting) for display. */
export function squadAverageRating(teamId: string | null | undefined): number | null {
  if (!teamId) return null;
  const squad = SQUADS[teamId.toUpperCase()];
  if (!squad || squad.length === 0) return null;
  return squad.reduce((s, p) => s + p.rating, 0) / squad.length;
}

/** A team's strongest players first — for the match-page squad panel. */
export function topPlayers(teamId: string | null | undefined, n = 6): Player[] {
  if (!teamId) return [];
  const squad = SQUADS[teamId.toUpperCase()];
  if (!squad) return [];
  return [...squad].sort((a, b) => effectiveRating(b) - effectiveRating(a)).slice(0, n);
}

/** Count of a team's key players plying their trade in a top-5 European league. */
export function topLeagueCount(teamId: string | null | undefined): number {
  if (!teamId) return 0;
  const squad = SQUADS[teamId.toUpperCase()];
  if (!squad) return 0;
  return squad.filter((p) => (LEAGUE_STRENGTH[p.league] ?? 0) >= 1).length;
}

/**
 * Squad-strength gap between two sides expressed in Elo-equivalent points, so it
 * can be folded into the same outcome model as ratings and form.
 */
export function squadEloDiff(homeId: string | null, awayId: string | null): number {
  return (squadStrength(homeId) - squadStrength(awayId)) * SQUAD_ELO_PER_POINT;
}

/**
 * Per-side multiplier on expected goals from the squad gap. A side meaningfully
 * stronger on paper is nudged to score a little more, its opponent a little
 * less — clamped so player data informs the scoreline without dominating it.
 */
export function squadGoalFactor(selfId: string | null, oppId: string | null): number {
  const gap = squadStrength(selfId) - squadStrength(oppId);
  return Math.max(0.72, Math.min(1.4, 1 + gap * 0.018));
}
