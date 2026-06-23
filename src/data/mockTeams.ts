import type { ConfederationCode, Team } from '@/types/domain';
import { teamRefFor } from './teamReference';

/**
 * A 32-team mock field — eight groups of four — used until the football-data
 * API is wired. Kit colors and flag codes come from the shared team reference
 * table; group letters drive the round-robin fixtures in mockBracket.ts.
 */
interface TeamMeta {
  id: string;
  name: string;
  confederation: ConfederationCode;
  group: string;
}

const TEAM_META: TeamMeta[] = [
  // Group A
  { id: 'ARG', name: 'Argentina', confederation: 'CONMEBOL', group: 'A' },
  { id: 'MEX', name: 'Mexico', confederation: 'CONCACAF', group: 'A' },
  { id: 'POL', name: 'Poland', confederation: 'UEFA', group: 'A' },
  { id: 'JOR', name: 'Jordan', confederation: 'AFC', group: 'A' },
  // Group B
  { id: 'FRA', name: 'France', confederation: 'UEFA', group: 'B' },
  { id: 'DEN', name: 'Denmark', confederation: 'UEFA', group: 'B' },
  { id: 'SEN', name: 'Senegal', confederation: 'CAF', group: 'B' },
  { id: 'IRQ', name: 'Iraq', confederation: 'AFC', group: 'B' },
  // Group C
  { id: 'BRA', name: 'Brazil', confederation: 'CONMEBOL', group: 'C' },
  { id: 'URU', name: 'Uruguay', confederation: 'CONMEBOL', group: 'C' },
  { id: 'CMR', name: 'Cameroon', confederation: 'CAF', group: 'C' },
  { id: 'NZL', name: 'New Zealand', confederation: 'OFC', group: 'C' },
  // Group D
  { id: 'ENG', name: 'England', confederation: 'UEFA', group: 'D' },
  { id: 'USA', name: 'United States', confederation: 'CONCACAF', group: 'D' },
  { id: 'TUN', name: 'Tunisia', confederation: 'CAF', group: 'D' },
  { id: 'IRN', name: 'Iran', confederation: 'AFC', group: 'D' },
  // Group E
  { id: 'ESP', name: 'Spain', confederation: 'UEFA', group: 'E' },
  { id: 'CRO', name: 'Croatia', confederation: 'UEFA', group: 'E' },
  { id: 'JPN', name: 'Japan', confederation: 'AFC', group: 'E' },
  { id: 'CRC', name: 'Costa Rica', confederation: 'CONCACAF', group: 'E' },
  // Group F
  { id: 'POR', name: 'Portugal', confederation: 'UEFA', group: 'F' },
  { id: 'KOR', name: 'South Korea', confederation: 'AFC', group: 'F' },
  { id: 'GHA', name: 'Ghana', confederation: 'CAF', group: 'F' },
  { id: 'UZB', name: 'Uzbekistan', confederation: 'AFC', group: 'F' },
  // Group G
  { id: 'NED', name: 'Netherlands', confederation: 'UEFA', group: 'G' },
  { id: 'ECU', name: 'Ecuador', confederation: 'CONMEBOL', group: 'G' },
  { id: 'EGY', name: 'Egypt', confederation: 'CAF', group: 'G' },
  { id: 'QAT', name: 'Qatar', confederation: 'AFC', group: 'G' },
  // Group H
  { id: 'GER', name: 'Germany', confederation: 'UEFA', group: 'H' },
  { id: 'BEL', name: 'Belgium', confederation: 'UEFA', group: 'H' },
  { id: 'SUI', name: 'Switzerland', confederation: 'UEFA', group: 'H' },
  { id: 'NGA', name: 'Nigeria', confederation: 'CAF', group: 'H' },
];

export const MOCK_TEAMS: Team[] = TEAM_META.map((t) => {
  const ref = teamRefFor(t.id);
  return {
    id: t.id,
    name: t.name,
    flagCode: ref.flagCode,
    confederation: t.confederation,
    colors: { primary: ref.primary, secondary: ref.secondary },
    group: t.group,
  };
});

export const MOCK_TEAMS_BY_ID: Record<string, Team> = Object.fromEntries(
  MOCK_TEAMS.map((t) => [t.id, t]),
);
