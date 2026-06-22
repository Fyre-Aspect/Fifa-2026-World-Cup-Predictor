/**
 * Fixed tournament constants for World Cup 2026. Dates are the official
 * opening match and final, in UTC. These are calendar facts, not API data.
 */
export const TOURNAMENT = {
  name: 'FIFA World Cup 2026',
  hosts: ['United States', 'Canada', 'Mexico'] as const,
  /** Opening match. */
  start: '2026-06-11T20:00:00Z',
  /** Final at MetLife Stadium. */
  final: '2026-07-19T19:00:00Z',
  teamCount: 48,
  groupCount: 12,
  cityCount: 16,
} as const;

export type TournamentPhase = 'pre' | 'live' | 'post';

export function tournamentPhase(now: Date = new Date()): TournamentPhase {
  const t = now.getTime();
  if (t < Date.parse(TOURNAMENT.start)) return 'pre';
  if (t > Date.parse(TOURNAMENT.final)) return 'post';
  return 'live';
}
