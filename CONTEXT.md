# GroupStage — Project Context & Working Memory

> A saved, durable snapshot of **what this project is, how it works, what is
> wrong with it today, and the plan to fix it.** Written before a round of
> larger changes (live data + visual overhaul) so the intent survives even if a
> change goes sideways. If you are an AI agent or a new contributor picking this
> up, read this first.

---

## 1. The main purpose (the "why")

GroupStage is an **interactive, visually striking FIFA World Cup 2026 prediction
site.** Two ideas define it:

1. **3D is the primary navigation surface.** The landing page is a rotating 3D
   globe of the 16 host cities. The bracket is a tournament tree you can fly
   through. The product should feel like a premium broadcast graphics package,
   not a spreadsheet.
2. **The model is honest.** Every number shown is a *model estimate with real
   uncertainty* — never presented as fact. The model keeps public score of how
   right it has been (Brier score, calibration) and nudges its own input weights
   after every finished match. The persistent "MODEL OUTPUT, NOT FACT" badge is
   load-bearing, not decoration.

The single most important product promise: **never invent a result.** A match
with a real captured result shows that result; a match without one is shown as
*upcoming* with a clearly-labelled model prediction.

---

## 2. Stack & architecture

| Concern       | Choice                                                       |
| ------------- | ------------------------------------------------------------ |
| Shell         | Vite + React 18 + TypeScript (strict)                        |
| 3D            | react-three-fiber + drei + three.js                          |
| Styling       | Tailwind CSS (custom theme), dark                            |
| Animation     | Framer Motion                                                |
| State         | Zustand — one store (`src/store/useStore.ts`)                |
| Validation    | Zod at every API boundary                                    |
| Data fetching | TanStack Query (stale-while-revalidate)                      |
| Charts        | Recharts                                                     |
| Backend proxy | Hono on one Vercel serverless route (`api/[[...route]].ts`)  |
| Model tests   | Vitest                                                       |

Everything runs client-side. The **only** server code is a tiny key-hiding proxy
so API keys never reach the browser. Free hosting target: Vercel free tier.

### Data flow (load → predict → render)

```
api/[[...route]].ts        Hono proxy: attaches secret keys, forwards upstream.
        │  /api/football/*  (and /api/odds/*)
        ▼
src/api/football.ts        fetch + Zod-validate + map upstream → domain types.
        ▼
src/hooks/useTournamentData.ts   TanStack Query; on failure → bundled snapshot.
        ▼
src/store/useStore.ts      single Zustand store (teams, matches, weights, …).
        ▼
src/hooks/useModel.ts      runs the prediction model over loaded fixtures.
        ▼
views/*                    Globe, Groups, Knockouts, Bracket, Match, Model.
```

If no API key is configured (or the upstream fails), `useTournamentData` falls
back to **bundled data**: `src/data/buildMockBracket()` using real captured
results from `src/data/realResults.ts`. `store.dataSource` tracks which is in
use: `'loading' | 'live' | 'mock'`.

### The model (`src/model/`)

A probability distribution over (home win, draw, away win) plus expected goals
per match, blended from weighted inputs:

- **Elo** — from four years of results, K scaled by match importance.
- **Recent form** — last ~10 matches, recency-weighted.
- **Squad** — player-rating signal.
- **Polymarket** — implied probabilities (de-vigged), keyless public API.
- **Bookmakers** — The Odds API consensus (de-vigged).

Starting weights live in `DEFAULT_WEIGHTS` (`useStore.ts`). After each finished
match the model scores itself (Brier) and nudges weights toward whichever input
was more correct. `scoreline.ts` turns expected goals into a most-likely exact
scoreline via independent Poisson marginals.

---

## 3. Key files (where to look)

| Area                | File(s)                                                       |
| ------------------- | ------------------------------------------------------------ |
| Backend proxy       | `api/[[...route]].ts`                                         |
| Live data client    | `src/api/football.ts`, `src/api/footballSchemas.ts`, `src/api/http.ts` |
| Data loading hook   | `src/hooks/useTournamentData.ts`, `src/api/queryClient.ts`   |
| Bundled snapshot    | `src/data/realResults.ts`, `src/data/mockBracket.ts`         |
| Store               | `src/store/useStore.ts`                                       |
| Model               | `src/model/*` (`predict.ts`, `scoreline.ts`, `elo.ts`, …)    |
| Knockout projection | `src/lib/knockout.ts`                                         |
| Theme               | `tailwind.config.ts`, `src/index.css`                        |
| Globe 3D            | `src/three/Globe.tsx`, `GlobeScene.tsx`, `useImageTexture.ts`|
| Views               | `src/views/*`                                                |

---

## 4. Known problems (the "what's wrong" — as of 2026-06-27)

1. ~~**Not real-time.**~~ **FIXED (2026-06-27).** The real cause was *env-file
   location*, not the provider: the keys were placed in `.env.example` (a
   template Vite never loads) instead of `.env.local`. With keys in `.env.local`
   the app goes live. **Correction:** football-data.org's *free* tier **does**
   cover the World Cup (competition `WC`, season 2026 — 104 fixtures, live
   scores). It is now the working primary live source; API-Football is optional.
   The bundled `realResults.ts` snapshot remains the graceful no-key fallback.
2. **Globe is "not even Earth."** `Globe.tsx` loads the Earth texture from a
   remote CDN (`unpkg.com/three-globe/...`). When that request is blocked /
   offline / rate-limited, `useImageTexture` returns null and the sphere falls
   back to a flat green colour — so users often see a green ball, not Earth.
3. **Bracket "doesn't make sense."** Every knockout tie renders as **`1–1 AET`**.
   Cause: `knockout.ts` uses the unconditional most-likely Poisson scoreline.
   For evenly-matched knockout games (low, similar xG) the modal scoreline is
   `1–1` almost every time, and `aet = (home === away)` then fires universally.
   A bracket where every semi/final is a 1–1 draw looks broken.
4. **Visually gloomy.** Deep-green/dark palette with flat cards reads as drab.
   Wanted: **FIFA World Cup 2026 brand colours**, liquid-glass surfaces, more
   interactivity, and proper mobile optimisation.

---

## 5. The plan (the "how we fix it")

1. **Live data → API-Football (api-sports.io).** Its free tier (100 req/day)
   covers the World Cup. Add an `apiFootball` branch in the proxy, a client +
   Zod schemas, and switch `useTournamentData` to prefer it. Keep the snapshot
   as graceful fallback. Surface the source honestly: a **SNAPSHOT / LIVE** badge
   with an "as of" time and a manual refresh.
   - Env: `API_FOOTBALL_KEY` (read only by the proxy). Register free at
     <https://www.api-football.com/>. League id for the World Cup is `1`; the
     2026 edition uses `season=2026`.
2. **Bracket fix.** In `knockout.ts`, make the displayed knockout scoreline
   **consistent with the projected winner** (most-likely *decisive* scoreline
   for the side that advances), and only flag `AET`/penalties for genuinely
   level ties — so scorelines vary (1–0, 2–1, 2–0) and make sense.
3. **Theme.** Re-skin `tailwind.config.ts` + `index.css` to the FIFA 26 palette
   with reusable **liquid-glass** surface utilities; brighten the base.
4. **Globe.** Bundle the Earth texture locally in `public/` so it always loads;
   improve material + lighting so it reads unmistakably as Earth.
5. **Mobile + interactivity.** Tighten the header/nav and view layouts for
   phones; add tactile motion.

### Honesty invariants (do not break)

- Never display an invented score as if real. Predicted = labelled predicted.
- Keep the "model output, not fact" messaging visible.
- The app must remain fully usable with **no API keys** (snapshot fallback).

---

## 6. Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b + vite build
npm run test     # Vitest (model logic)
```

Copy `.env.example` → `.env.local` and add keys to enable live data. Without
keys the app runs entirely on the bundled snapshot.
