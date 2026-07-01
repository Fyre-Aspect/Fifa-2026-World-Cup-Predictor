import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Dev-only plugin: mount the project's Hono API (api/index.ts) directly
 * inside Vite's dev server so `/api/*` is handled in-process. Previously dev
 * proxied /api to http://localhost:3000 (a `vercel dev` server), which spammed
 * ECONNREFUSED when that server wasn't running. Now the same serverless handler
 * runs here: with keys set it returns live data; without them it returns the
 * normal 503 the client already falls back from — no connection errors.
 */
function honoApiDev(): Plugin {
  // Headers we must not copy verbatim — Node sets length/encoding from the body.
  const SKIP = new Set(['content-length', 'content-encoding', 'transfer-encoding', 'connection']);
  return {
    name: 'hono-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const path = req.url ?? '';
        if (!path.startsWith('/api')) return next();
        try {
          // Vite transpiles the TS handler on the fly and gives us its exports.
          const mod = await server.ssrLoadModule('/api/index.ts');
          const app = mod.app as { fetch: (request: Request) => Promise<Response> };

          const host = req.headers.host ?? 'localhost';
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === 'string') headers.set(k, v);
            else if (Array.isArray(v)) headers.set(k, v.join(', '));
          }

          let body: Buffer | undefined;
          if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
            const chunks: Buffer[] = [];
            for await (const c of req) chunks.push(c as Buffer);
            body = Buffer.concat(chunks);
          }

          const response = await app.fetch(
            new Request(`http://${host}${path}`, { method: req.method ?? 'GET', headers, body }),
          );

          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            if (!SKIP.has(key.toLowerCase())) res.setHeader(key, value);
          });
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.ssrFixStacktrace?.(err as Error);
          next(err as Error);
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Expose non-VITE_ env vars (API keys) to the in-process API during dev.
  const env = loadEnv(mode, process.cwd(), '');
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }

  return {
    plugins: [react(), honoApiDev()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
    },
    build: {
      target: 'es2021',
      sourcemap: false,
      // three.js + drei is an expected large vendor chunk, loaded on demand.
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // Function form so a vendor chunk is only emitted when its packages
          // are actually part of the graph (commit 1 ships no 3D, so no three
          // chunk; commit 2 adds it).
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('three') || id.includes('@react-three')) return 'three';
            if (id.includes('recharts') || id.includes('/d3-')) return 'charts';
            return undefined;
          },
        },
      },
    },
  };
});
