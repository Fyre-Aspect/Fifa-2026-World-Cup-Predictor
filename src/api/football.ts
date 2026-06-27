import type {
  ConfederationCode,
  Match,
  MatchStage,
  MatchStatus,
  Team,
} from '@/types/domain';
import { apiGet } from './http';
import {
  fdMatchesResponse,
  fdStandingsResponse,
  fdTeamsResponse,
  type FdMatch,
  type FdTeam,
} from './footballSchemas';
import { teamRefFor } from '@/data/teamReference';
import { HOST_CITIES } from '@/data/cities';

export interface TournamentData {
  teams: Record<string, Team>;
  matches: Match[];
}

// ---- Mapping helpers --------------------------------------------------

function mapStage(stage: string): MatchStage {
  switch (stage.toUpperCase()) {
    case 'GROUP_STAGE':
    case 'GROUP':
      return 'group';
    case 'LAST_32':
    case 'ROUND_OF_32':
      return 'round32';
    case 'LAST_16':
    case 'ROUND_OF_16':
      return 'round16';
    case 'QUARTER_FINALS':
    case 'QUARTER_FINAL':
      return 'quarter';
    case 'SEMI_FINALS':
    case 'SEMI_FINAL':
      return 'semi';
    case 'THIRD_PLACE':
      return 'third';
    case 'FINAL':
      return 'final';
    default:
      return 'group';
  }
}

function mapStatus(status: string): MatchStatus {
  switch (status.toUpperCase()) {
    case 'IN_PLAY':
    case 'PAUSED':
    case 'LIVE':
      return 'live';
    case 'FINISHED':
    case 'AWARDED':
      return 'finished';
    default:
      return 'scheduled';
  }
}

function mapGroup(group: string | null | undefined): string | null {
  if (!group) return null;
  const m = /GROUP[_\s]?([A-L])/i.exec(group);
  return m ? m[1].toUpperCase() : null;
}

function teamIdOf(ref: { tla?: string | null; id: number | null }): string | null {
  if (ref.tla) return ref.tla.toUpperCase();
  // Pre-draw placeholders ("Winner Group A") have no tla — treat as TBD.
  return null;
}

function venueToCityId(venue: string | null | undefined): string {
  if (!venue) return '';
  const v = venue.toLowerCase();
  const hit = HOST_CITIES.find(
    (c) => v.includes(c.venue.toLowerCase()) || v.includes(c.name.toLowerCase()),
  );
  return hit?.id ?? '';
}

const CONMEBOL = new Set(['ARG', 'BRA', 'URU', 'COL', 'PER', 'CHI', 'PAR', 'ECU', 'BOL', 'VEN']);
const CONCACAF = new Set(['USA', 'MEX', 'CAN', 'CRC', 'PAN', 'JAM', 'HON', 'SLV', 'HAI', 'CUW']);
const CAF = new Set(['MAR', 'SEN', 'NGA', 'GHA', 'CMR', 'CIV', 'EGY', 'TUN', 'ALG', 'RSA', 'MLI', 'COD']);
const AFC = new Set(['JPN', 'KOR', 'KSA', 'IRN', 'AUS', 'QAT', 'UZB', 'JOR', 'IRQ', 'CHN']);
const OFC = new Set(['NZL', 'NCL', 'TAH']);

function confederationFor(tla: string): ConfederationCode {
  const t = tla.toUpperCase();
  if (CONMEBOL.has(t)) return 'CONMEBOL';
  if (CONCACAF.has(t)) return 'CONCACAF';
  if (CAF.has(t)) return 'CAF';
  if (AFC.has(t)) return 'AFC';
  if (OFC.has(t)) return 'OFC';
  return 'UEFA';
}

function mapTeam(fd: FdTeam, group: string | null): Team {
  const id = fd.tla ? fd.tla.toUpperCase() : `FD${fd.id}`;
  const ref = teamRefFor(fd.tla);
  return {
    id,
    name: fd.name,
    flagCode: ref.flagCode,
    confederation: confederationFor(id),
    colors: { primary: ref.primary, secondary: ref.secondary },
    group,
  };
}

function mapMatch(fd: FdMatch): Match {
  const hasScore = fd.score.fullTime.home != null && fd.score.fullTime.away != null;
  return {
    id: String(fd.id),
    stage: mapStage(fd.stage),
    group: mapGroup(fd.group),
    kickoff: fd.utcDate,
    cityId: venueToCityId(fd.venue),
    homeTeamId: teamIdOf(fd.homeTeam),
    awayTeamId: teamIdOf(fd.awayTeam),
    status: mapStatus(fd.status),
    score: hasScore
      ? { home: fd.score.fullTime.home as number, away: fd.score.fullTime.away as number }
      : null,
    minute: null,
  };
}

// ---- Public fetchers --------------------------------------------------

/** Maps team TLA -> group letter from the standings endpoint (best effort). */
async function fetchGroups(signal?: AbortSignal): Promise<Map<string, string>> {
  const groups = new Map<string, string>();
  try {
    const raw = await apiGet('/api/football/standings', signal);
    const parsed = fdStandingsResponse.parse(raw);
    for (const g of parsed.standings) {
      const letter = mapGroup(g.group);
      if (!letter) continue;
      for (const row of g.table) {
        if (row.team.tla) groups.set(row.team.tla.toUpperCase(), letter);
      }
    }
  } catch {
    // Standings are optional enrichment — ignore failures.
  }
  return groups;
}

/**
 * Fetches teams + fixtures from the proxy, validates with Zod, and maps to our
 * domain types. Throws if the API is unavailable or returns no fixtures, so the
 * caller falls back to bundled mock data.
 */
export async function fetchTournamentData(signal?: AbortSignal): Promise<TournamentData> {
  const [matchesRaw, teamsRaw] = await Promise.all([
    apiGet('/api/football/matches', signal),
    apiGet('/api/football/teams', signal),
  ]);

  const matchesParsed = fdMatchesResponse.parse(matchesRaw);
  const teamsParsed = fdTeamsResponse.parse(teamsRaw);

  if (matchesParsed.matches.length === 0) {
    throw new Error('no_fixtures');
  }

  const groups = await fetchGroups(signal);

  const teams: Record<string, Team> = {};
  for (const t of teamsParsed.teams) {
    const team = mapTeam(t, t.tla ? (groups.get(t.tla.toUpperCase()) ?? null) : null);
    teams[team.id] = team;
  }

  const matches = matchesParsed.matches.map(mapMatch);
  return { teams, matches };
}
