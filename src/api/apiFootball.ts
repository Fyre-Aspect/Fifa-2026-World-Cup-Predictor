import type { ConfederationCode, Match, MatchStage, MatchStatus, Team } from '@/types/domain';
import { apiGet } from './http';
import {
  afFixturesResponse,
  afStandingsResponse,
  type AfFixture,
} from './apiFootballSchemas';
import { TEAM_REFERENCE, teamRefFor } from '@/data/teamReference';
import { HOST_CITIES } from '@/data/cities';
import type { TournamentData } from './football';

/**
 * API-Football (api-sports.io) client. Its free tier covers the World Cup, so
 * this is GroupStage's primary live source. The tricky part is identity: this
 * provider keys teams by numeric id + full country name, while the rest of the
 * app (Elo seeds, squads, flags) is keyed by FIFA trigram (TLA). We resolve
 * each live team back to its TLA so the model lights up; unresolved teams still
 * render, just with neutral defaults.
 */

// ---- Identity: country name / code -> FIFA trigram --------------------

/** Strip accents + punctuation and lowercase, for tolerant name matching. */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Common API-Football country names → FIFA trigram used across the app. */
const NAME_TO_TLA: Record<string, string> = {
  argentina: 'ARG', brazil: 'BRA', france: 'FRA', england: 'ENG', spain: 'ESP',
  germany: 'GER', portugal: 'POR', netherlands: 'NED', belgium: 'BEL', croatia: 'CRO',
  uruguay: 'URU', usa: 'USA', 'united states': 'USA', mexico: 'MEX', canada: 'CAN',
  morocco: 'MAR', japan: 'JPN', senegal: 'SEN', italy: 'ITA', nigeria: 'NGA',
  ghana: 'GHA', cameroon: 'CMR', 'ivory coast': 'CIV', 'cote d ivoire': 'CIV',
  egypt: 'EGY', tunisia: 'TUN', algeria: 'ALG', 'korea republic': 'KOR',
  'south korea': 'KOR', 'saudi arabia': 'KSA', iran: 'IRN', 'ir iran': 'IRN',
  australia: 'AUS', qatar: 'QAT', ecuador: 'ECU', colombia: 'COL', peru: 'PER',
  chile: 'CHI', paraguay: 'PAR', switzerland: 'SUI', denmark: 'DEN', poland: 'POL',
  sweden: 'SWE', serbia: 'SRB', wales: 'WAL', scotland: 'SCO', austria: 'AUT',
  turkey: 'TUR', turkiye: 'TUR', ukraine: 'UKR', 'costa rica': 'CRC', panama: 'PAN',
  jamaica: 'JAM', 'new zealand': 'NZL', 'south africa': 'RSA', norway: 'NOR',
  'czech republic': 'CZE', czechia: 'CZE', hungary: 'HUN', uzbekistan: 'UZB',
  jordan: 'JOR', iraq: 'IRQ', 'bosnia and herzegovina': 'BIH', haiti: 'HAI',
  curacao: 'CUW', 'cape verde': 'CPV', 'cabo verde': 'CPV',
  'congo dr': 'COD', 'dr congo': 'COD', 'democratic republic of congo': 'COD',
};

/** Resolve a live team to its TLA id, preferring the name map, then a 3-letter code. */
function resolveTeamId(name: string, code?: string | null): string {
  const byName = NAME_TO_TLA[normalize(name)];
  if (byName) return byName;
  const c = code?.toUpperCase();
  if (c && c.length === 3 && TEAM_REFERENCE[c]) return c;
  if (c && c.length === 3) return c;
  // Last resort: first 3 letters of the normalized name, upper-cased.
  return normalize(name).replace(/\s/g, '').slice(0, 3).toUpperCase() || `AF`;
}

// ---- Field mapping ----------------------------------------------------

function mapStage(round: string | null | undefined): MatchStage {
  const r = (round ?? '').toLowerCase();
  if (r.includes('group')) return 'group';
  if (r.includes('round of 32') || r.includes('last 32')) return 'round32';
  if (r.includes('round of 16') || r.includes('last 16')) return 'round16';
  if (r.includes('quarter')) return 'quarter';
  if (r.includes('semi')) return 'semi';
  if (r.includes('3rd place') || r.includes('third')) return 'third';
  if (r.includes('final')) return 'final';
  return 'group';
}

const LIVE_CODES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT']);
const DONE_CODES = new Set(['FT', 'AET', 'PEN', 'WO', 'AWD']);

function mapStatus(short: string): MatchStatus {
  const s = short.toUpperCase();
  if (LIVE_CODES.has(s)) return 'live';
  if (DONE_CODES.has(s)) return 'finished';
  return 'scheduled';
}

const CONMEBOL = new Set(['ARG', 'BRA', 'URU', 'COL', 'PER', 'CHI', 'PAR', 'ECU', 'BOL', 'VEN']);
const CONCACAF = new Set(['USA', 'MEX', 'CAN', 'CRC', 'PAN', 'JAM', 'HON', 'SLV', 'HAI', 'CUW']);
const CAF = new Set(['MAR', 'SEN', 'NGA', 'GHA', 'CMR', 'CIV', 'EGY', 'TUN', 'ALG', 'RSA', 'MLI', 'COD', 'CPV']);
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

function venueToCityId(name?: string | null, city?: string | null): string {
  const hay = `${name ?? ''} ${city ?? ''}`.toLowerCase();
  if (!hay.trim()) return '';
  const hit = HOST_CITIES.find(
    (c) => hay.includes(c.venue.toLowerCase()) || hay.includes(c.name.toLowerCase()),
  );
  return hit?.id ?? '';
}

function teamFromId(id: string, name: string): Team {
  const ref = teamRefFor(id);
  return {
    id,
    name,
    flagCode: ref.flagCode,
    confederation: confederationFor(id),
    colors: { primary: ref.primary, secondary: ref.secondary },
    group: null,
  };
}

function mapFixture(fx: AfFixture, idToGroup: Map<string, string>): {
  match: Match;
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
} {
  const homeId = resolveTeamId(fx.teams.home.name);
  const awayId = resolveTeamId(fx.teams.away.name);
  const stage = mapStage(fx.league.round);
  const status = mapStatus(fx.fixture.status.short);
  const hasScore = fx.goals.home != null && fx.goals.away != null;

  const match: Match = {
    id: String(fx.fixture.id),
    stage,
    group: stage === 'group' ? (idToGroup.get(homeId) ?? null) : null,
    kickoff: fx.fixture.date,
    cityId: venueToCityId(fx.fixture.venue?.name, fx.fixture.venue?.city),
    homeTeamId: homeId,
    awayTeamId: awayId,
    status,
    score: hasScore ? { home: fx.goals.home as number, away: fx.goals.away as number } : null,
    minute: status === 'live' ? (fx.fixture.status.elapsed ?? null) : null,
  };
  return { match, homeId, awayId, homeName: fx.teams.home.name, awayName: fx.teams.away.name };
}

// ---- Group lookup from standings (best effort) ------------------------

async function fetchGroups(signal?: AbortSignal): Promise<Map<string, string>> {
  const idToGroup = new Map<string, string>();
  try {
    const raw = await apiGet('/api/apifootball/standings', signal);
    const parsed = afStandingsResponse.parse(raw);
    for (const entry of parsed.response) {
      for (const groupTable of entry.league.standings ?? []) {
        for (const row of groupTable) {
          const letter = /group\s+([a-l])/i.exec(row.group ?? '')?.[1]?.toUpperCase();
          if (!letter) continue;
          idToGroup.set(resolveTeamId(row.team.name), letter);
        }
      }
    }
  } catch {
    // Standings are optional enrichment — ignore failures.
  }
  return idToGroup;
}

// ---- Public fetcher ---------------------------------------------------

/**
 * Fetches fixtures from the API-Football proxy, validates with Zod, and maps to
 * our domain types. Teams are derived from the fixtures themselves (so we only
 * surface teams that are actually playing). Throws if the API is unavailable or
 * returns no fixtures, so the caller falls back to bundled snapshot data.
 */
export async function fetchTournamentDataApiFootball(signal?: AbortSignal): Promise<TournamentData> {
  const raw = await apiGet('/api/apifootball/fixtures', signal);
  const parsed = afFixturesResponse.parse(raw);
  if (parsed.response.length === 0) {
    throw new Error('no_fixtures');
  }

  const idToGroup = await fetchGroups(signal);

  const teams: Record<string, Team> = {};
  const matches: Match[] = [];
  for (const fx of parsed.response) {
    const { match, homeId, awayId, homeName, awayName } = mapFixture(fx, idToGroup);
    matches.push(match);
    if (!teams[homeId]) teams[homeId] = teamFromId(homeId, homeName);
    if (!teams[awayId]) teams[awayId] = teamFromId(awayId, awayName);
  }

  // Attach group letters to the teams we know.
  for (const [id, group] of idToGroup) {
    if (teams[id]) teams[id] = { ...teams[id], group };
  }

  return { teams, matches };
}
