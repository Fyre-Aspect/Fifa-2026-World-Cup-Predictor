import { z } from 'zod';

/**
 * Boundary schemas for the two market sources. As everywhere, the raw response
 * shape is never trusted — it is parsed here before the model touches it.
 */

// ---- The Odds API (h2h soccer) ----------------------------------------

const oddsOutcome = z.object({
  name: z.string(),
  price: z.number(),
});

const oddsMarket = z.object({
  key: z.string(),
  outcomes: z.array(oddsOutcome),
});

const oddsBookmaker = z.object({
  key: z.string(),
  title: z.string().optional(),
  markets: z.array(oddsMarket),
});

const oddsEvent = z.object({
  id: z.string(),
  commence_time: z.string(),
  home_team: z.string(),
  away_team: z.string(),
  bookmakers: z.array(oddsBookmaker),
});

export const oddsResponse = z.array(oddsEvent);
export type OddsEvent = z.infer<typeof oddsEvent>;

// ---- Polymarket Gamma --------------------------------------------------

/**
 * Gamma returns `outcomes` and `outcomePrices` as JSON-encoded strings. We keep
 * them as strings here and decode after parsing.
 */
const gammaMarket = z.object({
  question: z.string().optional(),
  closed: z.boolean().optional(),
  active: z.boolean().optional(),
  outcomes: z.string().optional(),
  outcomePrices: z.string().optional(),
  endDate: z.string().optional(),
});

export const gammaResponse = z.array(gammaMarket);
export type GammaMarket = z.infer<typeof gammaMarket>;

/** Safely decode a Gamma JSON-string field into a string array. */
export function decodeGammaArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    return [];
  } catch {
    return [];
  }
}
