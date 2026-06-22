import type { Match, MatchStage } from '@/types/domain';

/**
 * A representative mock bracket: a sample of finished group matches at the
 * base, then a full knockout tree rising to the final. Replaced by real
 * fixtures in commit 3, but it exercises every match state (finished, live,
 * scheduled) so the 3D bracket and detail views have something honest to show.
 */

interface Seed {
  id: string;
  stage: MatchStage;
  group: string | null;
  home: string | null;
  away: string | null;
  cityId: string;
  /** Days after the tournament opening match. */
  day: number;
  hour: number;
  status: Match['status'];
  score: Match['score'];
  minute: number | null;
}

const OPENING = Date.parse('2026-06-11T20:00:00Z');
const DAY_MS = 86_400_000;

function kickoff(day: number, hour: number): string {
  return new Date(OPENING + day * DAY_MS + hour * 3_600_000).toISOString();
}

const SEEDS: Seed[] = [
  // ---- Group stage sample (finished) --------------------------------
  { id: 'G-A1', stage: 'group', group: 'A', home: 'ARG', away: 'BEL', cityId: 'nyc', day: 1, hour: 0, status: 'finished', score: { home: 2, away: 1 }, minute: null },
  { id: 'G-B1', stage: 'group', group: 'B', home: 'FRA', away: 'CRO', cityId: 'lax', day: 1, hour: 3, status: 'finished', score: { home: 1, away: 1 }, minute: null },
  { id: 'G-C1', stage: 'group', group: 'C', home: 'BRA', away: 'URU', cityId: 'mia', day: 2, hour: 0, status: 'finished', score: { home: 3, away: 0 }, minute: null },
  { id: 'G-D1', stage: 'group', group: 'D', home: 'ENG', away: 'USA', cityId: 'dal', day: 2, hour: 3, status: 'finished', score: { home: 0, away: 0 }, minute: null },
  { id: 'G-E1', stage: 'group', group: 'E', home: 'ESP', away: 'MEX', cityId: 'mex', day: 3, hour: 0, status: 'finished', score: { home: 2, away: 2 }, minute: null },
  { id: 'G-F1', stage: 'group', group: 'F', home: 'POR', away: 'MAR', cityId: 'atl', day: 3, hour: 3, status: 'finished', score: { home: 1, away: 2 }, minute: null },
  { id: 'G-G1', stage: 'group', group: 'G', home: 'NED', away: 'JPN', cityId: 'sea', day: 4, hour: 0, status: 'finished', score: { home: 2, away: 0 }, minute: null },
  { id: 'G-H1', stage: 'group', group: 'H', home: 'GER', away: 'SEN', cityId: 'kan', day: 4, hour: 3, status: 'finished', score: { home: 1, away: 1 }, minute: null },

  // ---- Round of 16 (one live, rest scheduled) -----------------------
  { id: 'R16-1', stage: 'round16', group: null, home: 'ARG', away: 'JPN', cityId: 'nyc', day: 17, hour: 0, status: 'live', score: { home: 1, away: 0 }, minute: 63 },
  { id: 'R16-2', stage: 'round16', group: null, home: 'FRA', away: 'SEN', cityId: 'tor', day: 17, hour: 3, status: 'scheduled', score: null, minute: null },
  { id: 'R16-3', stage: 'round16', group: null, home: 'BRA', away: 'MEX', cityId: 'mex', day: 18, hour: 0, status: 'scheduled', score: null, minute: null },
  { id: 'R16-4', stage: 'round16', group: null, home: 'ENG', away: 'MAR', cityId: 'bos', day: 18, hour: 3, status: 'scheduled', score: null, minute: null },
  { id: 'R16-5', stage: 'round16', group: null, home: 'ESP', away: 'USA', cityId: 'phi', day: 19, hour: 0, status: 'scheduled', score: null, minute: null },
  { id: 'R16-6', stage: 'round16', group: null, home: 'POR', away: 'URU', cityId: 'hou', day: 19, hour: 3, status: 'scheduled', score: null, minute: null },
  { id: 'R16-7', stage: 'round16', group: null, home: 'NED', away: 'CRO', cityId: 'sfo', day: 20, hour: 0, status: 'scheduled', score: null, minute: null },
  { id: 'R16-8', stage: 'round16', group: null, home: 'GER', away: 'BEL', cityId: 'atl', day: 20, hour: 3, status: 'scheduled', score: null, minute: null },

  // ---- Quarter-finals (seeded participants, scheduled) --------------
  { id: 'QF-1', stage: 'quarter', group: null, home: 'ARG', away: 'FRA', cityId: 'lax', day: 24, hour: 0, status: 'scheduled', score: null, minute: null },
  { id: 'QF-2', stage: 'quarter', group: null, home: 'BRA', away: 'ENG', cityId: 'mia', day: 24, hour: 3, status: 'scheduled', score: null, minute: null },
  { id: 'QF-3', stage: 'quarter', group: null, home: 'ESP', away: 'POR', cityId: 'dal', day: 25, hour: 0, status: 'scheduled', score: null, minute: null },
  { id: 'QF-4', stage: 'quarter', group: null, home: 'NED', away: 'GER', cityId: 'kan', day: 25, hour: 3, status: 'scheduled', score: null, minute: null },

  // ---- Semi-finals --------------------------------------------------
  { id: 'SF-1', stage: 'semi', group: null, home: 'ARG', away: 'BRA', cityId: 'dal', day: 28, hour: 0, status: 'scheduled', score: null, minute: null },
  { id: 'SF-2', stage: 'semi', group: null, home: 'ESP', away: 'NED', cityId: 'atl', day: 29, hour: 0, status: 'scheduled', score: null, minute: null },

  // ---- Final --------------------------------------------------------
  { id: 'FIN', stage: 'final', group: null, home: 'ARG', away: 'ESP', cityId: 'nyc', day: 38, hour: 0, status: 'scheduled', score: null, minute: null },
];

export function buildMockBracket(): Match[] {
  return SEEDS.map((s) => ({
    id: s.id,
    stage: s.stage,
    group: s.group,
    kickoff: kickoff(s.day, s.hour),
    cityId: s.cityId,
    homeTeamId: s.home,
    awayTeamId: s.away,
    status: s.status,
    score: s.score,
    minute: s.minute,
  }));
}
