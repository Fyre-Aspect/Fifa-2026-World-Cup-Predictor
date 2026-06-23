import type { ConfederationCode, Team } from '@/types/domain';
import { teamRefFor } from './teamReference';

/**
 * The real 48-team field for the 2026 FIFA World Cup, in the twelve groups
 * (A–L) of the official final draw held on 5 December 2025 in Washington, D.C.,
 * with the post-playoff qualifiers filled in. Kit colours and flag codes come
 * from the shared team reference table; group letters drive the round-robin
 * fixtures in mockBracket.ts. Used until the football-data API is wired.
 *
 * Source: 2026 FIFA World Cup draw (en.wikipedia.org/wiki/2026_FIFA_World_Cup_draw).
 */
interface TeamMeta {
  id: string;
  name: string;
  confederation: ConfederationCode;
  group: string;
}

const TEAM_META: TeamMeta[] = [
  // Group A
  { id: 'MEX', name: 'Mexico', confederation: 'CONCACAF', group: 'A' },
  { id: 'RSA', name: 'South Africa', confederation: 'CAF', group: 'A' },
  { id: 'KOR', name: 'South Korea', confederation: 'AFC', group: 'A' },
  { id: 'CZE', name: 'Czechia', confederation: 'UEFA', group: 'A' },
  // Group B
  { id: 'CAN', name: 'Canada', confederation: 'CONCACAF', group: 'B' },
  { id: 'BIH', name: 'Bosnia & Herzegovina', confederation: 'UEFA', group: 'B' },
  { id: 'QAT', name: 'Qatar', confederation: 'AFC', group: 'B' },
  { id: 'SUI', name: 'Switzerland', confederation: 'UEFA', group: 'B' },
  // Group C
  { id: 'BRA', name: 'Brazil', confederation: 'CONMEBOL', group: 'C' },
  { id: 'MAR', name: 'Morocco', confederation: 'CAF', group: 'C' },
  { id: 'HAI', name: 'Haiti', confederation: 'CONCACAF', group: 'C' },
  { id: 'SCO', name: 'Scotland', confederation: 'UEFA', group: 'C' },
  // Group D
  { id: 'USA', name: 'United States', confederation: 'CONCACAF', group: 'D' },
  { id: 'PAR', name: 'Paraguay', confederation: 'CONMEBOL', group: 'D' },
  { id: 'AUS', name: 'Australia', confederation: 'AFC', group: 'D' },
  { id: 'TUR', name: 'Türkiye', confederation: 'UEFA', group: 'D' },
  // Group E
  { id: 'GER', name: 'Germany', confederation: 'UEFA', group: 'E' },
  { id: 'CUW', name: 'Curaçao', confederation: 'CONCACAF', group: 'E' },
  { id: 'CIV', name: "Côte d'Ivoire", confederation: 'CAF', group: 'E' },
  { id: 'ECU', name: 'Ecuador', confederation: 'CONMEBOL', group: 'E' },
  // Group F
  { id: 'NED', name: 'Netherlands', confederation: 'UEFA', group: 'F' },
  { id: 'JPN', name: 'Japan', confederation: 'AFC', group: 'F' },
  { id: 'SWE', name: 'Sweden', confederation: 'UEFA', group: 'F' },
  { id: 'TUN', name: 'Tunisia', confederation: 'CAF', group: 'F' },
  // Group G
  { id: 'BEL', name: 'Belgium', confederation: 'UEFA', group: 'G' },
  { id: 'EGY', name: 'Egypt', confederation: 'CAF', group: 'G' },
  { id: 'IRN', name: 'Iran', confederation: 'AFC', group: 'G' },
  { id: 'NZL', name: 'New Zealand', confederation: 'OFC', group: 'G' },
  // Group H
  { id: 'ESP', name: 'Spain', confederation: 'UEFA', group: 'H' },
  { id: 'CPV', name: 'Cape Verde', confederation: 'CAF', group: 'H' },
  { id: 'KSA', name: 'Saudi Arabia', confederation: 'AFC', group: 'H' },
  { id: 'URU', name: 'Uruguay', confederation: 'CONMEBOL', group: 'H' },
  // Group I
  { id: 'FRA', name: 'France', confederation: 'UEFA', group: 'I' },
  { id: 'SEN', name: 'Senegal', confederation: 'CAF', group: 'I' },
  { id: 'IRQ', name: 'Iraq', confederation: 'AFC', group: 'I' },
  { id: 'NOR', name: 'Norway', confederation: 'UEFA', group: 'I' },
  // Group J
  { id: 'ARG', name: 'Argentina', confederation: 'CONMEBOL', group: 'J' },
  { id: 'ALG', name: 'Algeria', confederation: 'CAF', group: 'J' },
  { id: 'AUT', name: 'Austria', confederation: 'UEFA', group: 'J' },
  { id: 'JOR', name: 'Jordan', confederation: 'AFC', group: 'J' },
  // Group K
  { id: 'POR', name: 'Portugal', confederation: 'UEFA', group: 'K' },
  { id: 'COD', name: 'DR Congo', confederation: 'CAF', group: 'K' },
  { id: 'UZB', name: 'Uzbekistan', confederation: 'AFC', group: 'K' },
  { id: 'COL', name: 'Colombia', confederation: 'CONMEBOL', group: 'K' },
  // Group L
  { id: 'ENG', name: 'England', confederation: 'UEFA', group: 'L' },
  { id: 'CRO', name: 'Croatia', confederation: 'UEFA', group: 'L' },
  { id: 'GHA', name: 'Ghana', confederation: 'CAF', group: 'L' },
  { id: 'PAN', name: 'Panama', confederation: 'CONCACAF', group: 'L' },
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
