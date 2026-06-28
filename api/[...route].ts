import { Hono } from 'hono';
import { handle } from 'hono/vercel';

/**
 * GroupStage backend proxy — the only server-side code in the project.
 *
 * Its single job is to hide API keys: the browser calls our own /api/* routes,
 * and this function attaches the secret key and forwards to the upstream
 * provider. Keys are read from environment variables and never reach the
 * client. If a key is missing, we return a clear 503 so the app can fall back
 * to bundled mock/historical data instead of hard-failing.
 */

// Edge runtime: this is the runtime `hono/vercel`'s `handle` targets, and the
// proxy only needs `fetch` + `process.env` (both available on Edge). The Node
// runtime needs a different adapter (@hono/node-server/vercel) and was silently
// failing on Vercel even though local dev — which calls app.fetch() directly —
// worked fine.
export const config = { runtime: 'edge' };

const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';
const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

const app = new Hono().basePath('/api');

app.get('/health', (c) =>
  c.json({
    ok: true,
    services: {
      apiFootball: Boolean(process.env.API_FOOTBALL_KEY),
      footballData: Boolean(process.env.FOOTBALL_DATA_API_KEY),
      oddsApi: Boolean(process.env.ODDS_API_KEY),
    },
  }),
);

/**
 * API-Football (api-sports.io) proxy: /api/apifootball/<resource>?league=1&season=2026
 * resource ∈ { fixtures, teams, standings }. Its free tier (100 req/day) covers
 * the World Cup, so this is GroupStage's primary live source. The secret key is
 * attached here and never reaches the browser.
 */
app.get('/apifootball/:resource', async (c) => {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return c.json({ error: 'missing_api_football_key' }, 503);
  }

  const resource = c.req.param('resource');
  const allowed = new Set(['fixtures', 'teams', 'standings']);
  if (!allowed.has(resource)) {
    return c.json({ error: 'unknown_resource' }, 404);
  }

  // World Cup is league 1; the 2026 edition is season 2026. Both overridable.
  const league = c.req.query('league') ?? '1';
  const season = c.req.query('season') ?? '2026';
  const params = new URLSearchParams({ league, season });
  if (resource === 'fixtures' && c.req.query('live')) {
    params.set('live', c.req.query('live') as string);
  }
  const url = `${API_FOOTBALL_BASE}/${resource}?${params.toString()}`;

  try {
    const upstream = await fetch(url, {
      headers: { 'x-apisports-key': key },
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
        // Short edge cache; the client manages its own SWR cache too.
        'cache-control': 'public, max-age=0, s-maxage=20',
      },
    });
  } catch {
    return c.json({ error: 'upstream_unreachable' }, 502);
  }
});

/**
 * football-data.org proxy: /api/football/<resource>?competition=WC
 * resource ∈ { matches, teams, standings }.
 */
app.get('/football/:resource', async (c) => {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) {
    return c.json({ error: 'missing_football_data_key' }, 503);
  }

  const resource = c.req.param('resource');
  const allowed = new Set(['matches', 'teams', 'standings']);
  if (!allowed.has(resource)) {
    return c.json({ error: 'unknown_resource' }, 404);
  }

  const competition = c.req.query('competition') ?? 'WC';
  const url = `${FOOTBALL_DATA_BASE}/competitions/${encodeURIComponent(competition)}/${resource}`;

  try {
    const upstream = await fetch(url, {
      headers: { 'X-Auth-Token': key },
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
        // Short edge cache; the client manages its own SWR cache too.
        'cache-control': 'public, max-age=0, s-maxage=300',
      },
    });
  } catch {
    return c.json({ error: 'upstream_unreachable' }, 502);
  }
});

/**
 * The Odds API proxy: /api/odds/<sportKey>?regions=...&markets=...
 * Used by the prediction model for bookmaker consensus (commit 4).
 */
app.get('/odds/:sportKey', async (c) => {
  const key = process.env.ODDS_API_KEY;
  if (!key) {
    return c.json({ error: 'missing_odds_api_key' }, 503);
  }

  const sportKey = c.req.param('sportKey');
  const regions = c.req.query('regions') ?? 'us,uk,eu';
  const markets = c.req.query('markets') ?? 'h2h';
  const url = `${ODDS_API_BASE}/sports/${encodeURIComponent(
    sportKey,
  )}/odds?regions=${regions}&markets=${markets}&oddsFormat=decimal&apiKey=${key}`;

  try {
    const upstream = await fetch(url);
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
        'cache-control': 'public, max-age=0, s-maxage=60',
      },
    });
  } catch {
    return c.json({ error: 'upstream_unreachable' }, 502);
  }
});

app.notFound((c) => c.json({ error: 'not_found' }, 404));

// Exported so the Vite dev server can mount the same Hono app in-process
// (see the hono-api-dev plugin in vite.config.ts), instead of proxying to a
// separate `vercel dev` process that may not be running.
export { app };

export default handle(app);
