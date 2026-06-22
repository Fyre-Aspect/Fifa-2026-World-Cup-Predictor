import type { Team } from '@/types/domain';

/**
 * A 16-team mock field used until the football-data API is wired (commit 3).
 * Colors are approximate kit colors used for the procedural 3D jerseys; flag
 * codes are flagcdn.com codes (ISO 3166-1 alpha-2, plus gb-eng for England).
 */
export const MOCK_TEAMS: Team[] = [
  { id: 'ARG', name: 'Argentina', flagCode: 'ar', confederation: 'CONMEBOL', colors: { primary: '#6C9BD2', secondary: '#ffffff' }, group: 'A' },
  { id: 'FRA', name: 'France', flagCode: 'fr', confederation: 'UEFA', colors: { primary: '#1f3c88', secondary: '#ffffff' }, group: 'B' },
  { id: 'BRA', name: 'Brazil', flagCode: 'br', confederation: 'CONMEBOL', colors: { primary: '#fedd00', secondary: '#009739' }, group: 'C' },
  { id: 'ENG', name: 'England', flagCode: 'gb-eng', confederation: 'UEFA', colors: { primary: '#f4f4f4', secondary: '#cf142b' }, group: 'D' },
  { id: 'ESP', name: 'Spain', flagCode: 'es', confederation: 'UEFA', colors: { primary: '#c60b1e', secondary: '#f1bf00' }, group: 'E' },
  { id: 'POR', name: 'Portugal', flagCode: 'pt', confederation: 'UEFA', colors: { primary: '#da291c', secondary: '#006847' }, group: 'F' },
  { id: 'NED', name: 'Netherlands', flagCode: 'nl', confederation: 'UEFA', colors: { primary: '#f36c21', secondary: '#ffffff' }, group: 'G' },
  { id: 'GER', name: 'Germany', flagCode: 'de', confederation: 'UEFA', colors: { primary: '#1a1a1a', secondary: '#d00000' }, group: 'H' },
  { id: 'BEL', name: 'Belgium', flagCode: 'be', confederation: 'UEFA', colors: { primary: '#e30613', secondary: '#fdda24' }, group: 'A' },
  { id: 'CRO', name: 'Croatia', flagCode: 'hr', confederation: 'UEFA', colors: { primary: '#d81e05', secondary: '#ffffff' }, group: 'B' },
  { id: 'URU', name: 'Uruguay', flagCode: 'uy', confederation: 'CONMEBOL', colors: { primary: '#5ba3d9', secondary: '#ffffff' }, group: 'C' },
  { id: 'USA', name: 'United States', flagCode: 'us', confederation: 'CONCACAF', colors: { primary: '#0a3161', secondary: '#b31942' }, group: 'D' },
  { id: 'MEX', name: 'Mexico', flagCode: 'mx', confederation: 'CONCACAF', colors: { primary: '#006847', secondary: '#ce1126' }, group: 'E' },
  { id: 'MAR', name: 'Morocco', flagCode: 'ma', confederation: 'CAF', colors: { primary: '#c1272d', secondary: '#006233' }, group: 'F' },
  { id: 'JPN', name: 'Japan', flagCode: 'jp', confederation: 'AFC', colors: { primary: '#1b2a6b', secondary: '#ffffff' }, group: 'G' },
  { id: 'SEN', name: 'Senegal', flagCode: 'sn', confederation: 'CAF', colors: { primary: '#00853f', secondary: '#fdef42' }, group: 'H' },
];

export const MOCK_TEAMS_BY_ID: Record<string, Team> = Object.fromEntries(
  MOCK_TEAMS.map((t) => [t.id, t]),
);
