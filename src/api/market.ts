import type { Match, Team } from '@/types/domain';
import type { MarketTable, Outcome } from '@/model/types';
import { deVig, impliedFromDecimal, deVigTwoWayWithDraw } from '@/model/devig';
import { apiGet } from './http';
import {
  decodeGammaArray,
  gammaResponse,
  oddsResponse,
  type OddsEvent,
} from './marketSchemas';

const ODDS_SPORT_KEY = 'soccer_fifa_world_cup';
const GAMMA_MARKETS_URL =
  'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=500';

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Index team names (and trigrams) to team ids for fuzzy market matching. */
function buildNameIndex(teams: Record<string, Team>): Map<string, string> {
  const index = new Map<string, string>();
  for (const team of Object.values(teams)) {
    index.set(normalizeName(team.name), team.id);
    index.set(normalizeName(team.id), team.id);
  }
  return index;
}

function findTeamId(index: Map<string, string>, name: string): string | null {
  const norm = normalizeName(name);
  if (index.has(norm)) return index.get(norm) as string;
  // Loose contains match for names like "Korea Republic" vs "South Korea".
  for (const [key, id] of index) {
    if (key.length >= 4 && (norm.includes(key) || key.includes(norm))) return id;
  }
  return null;
}

/** Find an upcoming/live fixture for a team pair, nearest to the market time. */
function matchFixture(
  matches: Match[],
  homeId: string,
  awayId: string,
  commenceTime: string,
): Match | null {
  const t = Date.parse(commenceTime);
  const candidates = matches.filter(
    (m) =>
      m.status !== 'finished' &&
      ((m.homeTeamId === homeId && m.awayTeamId === awayId) ||
        (m.homeTeamId === awayId && m.awayTeamId === homeId)),
  );
  if (candidates.length === 0) return null;
  return candidates.sort(
    (a, b) => Math.abs(Date.parse(a.kickoff) - t) - Math.abs(Date.parse(b.kickoff) - t),
  )[0];
}

/** Consensus de-vigged 3-way outcome from one odds event's bookmakers. */
function consensusOutcome(event: OddsEvent): Outcome | null {
  let homeSum = 0;
  let drawSum = 0;
  let awaySum = 0;
  let count = 0;

  for (const book of event.bookmakers) {
    const h2h = book.markets.find((m) => m.key === 'h2h');
    if (!h2h) continue;
    const priceFor = (name: string) =>
      h2h.outcomes.find((o) => o.name === name)?.price;
    const hp = priceFor(event.home_team);
    const ap = priceFor(event.away_team);
    const dp = priceFor('Draw');
    if (hp == null || ap == null) continue;
    homeSum += impliedFromDecimal(hp);
    awaySum += impliedFromDecimal(ap);
    drawSum += dp != null ? impliedFromDecimal(dp) : 0;
    count += 1;
  }

  if (count === 0) return null;
  const [h, d, a] = deVig([homeSum / count, drawSum / count, awaySum / count]);
  if (h == null || d == null || a == null) return null;
  return { homeWin: h, draw: d, awayWin: a };
}

/**
 * Bookmaker consensus (The Odds API), de-vigged and matched to fixtures.
 * Returns an empty table on any failure so the model degrades gracefully.
 */
export async function fetchBooksTable(
  teams: Record<string, Team>,
  matches: Match[],
  signal?: AbortSignal,
): Promise<MarketTable> {
  const table: MarketTable = {};
  try {
    const raw = await apiGet(
      `/api/odds/${ODDS_SPORT_KEY}?regions=us,uk,eu&markets=h2h`,
      signal,
    );
    const events = oddsResponse.parse(raw);
    const index = buildNameIndex(teams);

    for (const event of events) {
      const homeId = findTeamId(index, event.home_team);
      const awayId = findTeamId(index, event.away_team);
      if (!homeId || !awayId) continue;
      const fixture = matchFixture(matches, homeId, awayId, event.commence_time);
      if (!fixture) continue;
      const outcome = consensusOutcome(event);
      if (!outcome) continue;
      // Align the outcome to the fixture's home/away orientation.
      table[fixture.id] =
        fixture.homeTeamId === homeId
          ? outcome
          : { homeWin: outcome.awayWin, draw: outcome.draw, awayWin: outcome.homeWin };
    }
  } catch {
    // No key, blocked, or schema drift — fall back to no books input.
  }
  return table;
}

/**
 * Polymarket Gamma implied probabilities for per-match markets, de-vigged and
 * matched to fixtures. Gamma is public (no key) and called directly. Per-match
 * soccer markets are sparse, so this is best-effort and often empty — which the
 * blend handles by leaning on the other inputs.
 */
export async function fetchPolymarketTable(
  teams: Record<string, Team>,
  matches: Match[],
  signal?: AbortSignal,
): Promise<MarketTable> {
  const table: MarketTable = {};
  try {
    const res = await fetch(GAMMA_MARKETS_URL, { signal, headers: { accept: 'application/json' } });
    if (!res.ok) return table;
    const markets = gammaResponse.parse(await res.json());
    const index = buildNameIndex(teams);

    for (const market of markets) {
      if (!market.question || market.closed) continue;
      const labels = decodeGammaArray(market.outcomes);
      const prices = decodeGammaArray(market.outcomePrices).map(Number);
      if (labels.length !== 2 || prices.length !== 2) continue;

      const idA = findTeamId(index, labels[0]);
      const idB = findTeamId(index, labels[1]);
      if (!idA || !idB || idA === idB) continue;

      const fixture = matchFixture(matches, idA, idB, market.endDate ?? new Date().toISOString());
      if (!fixture) continue;

      // Gamma prices are already probabilities; fold in a draw prior.
      const pa = prices[0];
      const pb = prices[1];
      if (!Number.isFinite(pa) || !Number.isFinite(pb) || pa + pb <= 0) continue;
      const outcome = deVigTwoWayWithDraw(1 / pa, 1 / pb);
      table[fixture.id] =
        fixture.homeTeamId === idA
          ? outcome
          : { homeWin: outcome.awayWin, draw: outcome.draw, awayWin: outcome.homeWin };
    }
  } catch {
    // CORS, network, or schema drift — no polymarket input this round.
  }
  return table;
}
