import { z } from 'zod';

/**
 * Zod schemas for the API-Football (api-sports.io) v3 responses, covering only
 * the fields GroupStage consumes. Every response is shaped as
 * `{ response: [...] }`; we never trust the raw payload — it is parsed here.
 */

const afStatus = z.object({
  long: z.string().nullable().optional(),
  short: z.string(),
  elapsed: z.number().nullable().optional(),
});

const afVenue = z
  .object({
    name: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
  })
  .nullable()
  .optional();

const afTeamRef = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string().nullable().optional(),
});

const afFixture = z.object({
  fixture: z.object({
    id: z.number(),
    date: z.string(),
    status: afStatus,
    venue: afVenue,
  }),
  league: z.object({
    id: z.number(),
    season: z.number().nullable().optional(),
    round: z.string().nullable().optional(),
  }),
  teams: z.object({
    home: afTeamRef,
    away: afTeamRef,
  }),
  goals: z.object({
    home: z.number().nullable(),
    away: z.number().nullable(),
  }),
});

export const afFixturesResponse = z.object({
  response: z.array(afFixture),
});

const afTeamEntry = z.object({
  team: z.object({
    id: z.number(),
    name: z.string(),
    code: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    logo: z.string().nullable().optional(),
  }),
});

export const afTeamsResponse = z.object({
  response: z.array(afTeamEntry),
});

const afStandingRow = z.object({
  rank: z.number().nullable().optional(),
  team: afTeamRef,
  group: z.string().nullable().optional(),
});

export const afStandingsResponse = z.object({
  response: z.array(
    z.object({
      league: z.object({
        // standings is an array of groups, each an array of rows.
        standings: z.array(z.array(afStandingRow)).nullable().optional(),
      }),
    }),
  ),
});

export type AfFixture = z.infer<typeof afFixture>;
export type AfTeamEntry = z.infer<typeof afTeamEntry>;
export type AfStandingsResponse = z.infer<typeof afStandingsResponse>;
