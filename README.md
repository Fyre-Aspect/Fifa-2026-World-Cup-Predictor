# GroupStage

An interactive, visually striking **FIFA World Cup 2026** prediction site. 3D is
the primary navigation surface — a rotating globe of host cities and a
tournament tree suspended in space. Behind it sits an **honest** prediction
model that keeps public score of how right it is.

> Every number here is a model estimate with real uncertainty — shown with a
> confidence band and the model's own running accuracy. Never presented as fact.

## Stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Shell          | Vite + React 18 + TypeScript (strict)               |
| 3D             | react-three-fiber + drei + three.js                 |
| Styling        | Tailwind CSS, custom pitch-green / gold theme, dark |
| Animation      | Framer Motion                                       |
| State          | Zustand (one store)                                 |
| Validation     | Zod at every API boundary                           |
| Data fetching  | TanStack Query (stale-while-revalidate)             |
| Charts         | Recharts                                            |
| Backend proxy  | Hono on one Vercel serverless route                 |
| Model tests    | Vitest                                              |

Everything runs client-side. The only server code is a tiny key-hiding proxy.
The whole stack is MIT/BSD-compatible and free; hosting targets Vercel's free
tier.

## Develop

```bash
npm install
npm run dev      # app at http://localhost:5173
npm run build    # type-check (tsc -b) + production build
npm run test     # Vitest — prediction model logic
```

Copy `.env.example` to `.env.local` and add free API keys if you want live data.
Without keys, the app runs entirely on bundled mock/historical data.

## Views

1. **Globe** (landing) — rotating 3D Earth, host-city pins, countdown, top-3 picks.
2. **Bracket** — full 3D tournament tree; click a match to flip to its prediction.
3. **Match detail** — pre-match forecast, live score, post-match analysis.
4. **Team** — rotating 3D jersey, four years of results, Elo trajectory, predicted run.
5. **Model dashboard** — running accuracy, weight evolution, calibration plot.

## The model

A probability distribution over (home win, draw, away win) plus expected goals
for every match, blended from four weighted inputs:

- **Team strength** — Elo from four years of results, K scaled by match importance.
- **Recent form** — last 10 matches, recency-weighted.
- **Polymarket** — implied probabilities from the Gamma API, de-vigged.
- **Bookmakers** — consensus odds from The Odds API, de-vigged.

Starting weights: Elo 30% · form 15% · Polymarket 30% · books 25% (tunable in a
debug panel). After every finished match the model scores itself with the Brier
score and nudges the weights toward whichever input was more correct — so the
predictions evolve as the tournament unfolds.

## License

MIT.
