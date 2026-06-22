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

export const config = { runtime: 'nodejs' };

const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

const app = new Hono().basePath('/api');

app.get('/health', (c) =>
  c.json({
    ok: true,
    services: {
      footballData: Boolean(process.env.FOOTBALL_DATA_API_KEY),
      oddsApi: Boolean(process.env.ODDS_API_KEY),
    },
  }),
);

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

export default handle(app);
