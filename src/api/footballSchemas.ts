import { z } from 'zod';

/**
 * Zod schemas for the football-data.org v4 responses, covering only the fields
 * GroupStage consumes. Everything that crosses this boundary is parsed here —
 * the raw response shape is never trusted. Unknown fields are ignored, and
 * optional/nullable shapes mirror football-data's pre-draw placeholders.
 */

const fdTeamRef = z.object({
  id: z.number(),
  name: z.string().nullable().optional(),
  tla: z.string().nullable().optional(),
  crest: z.string().nullable().optional(),
});

const fdScore = z.object({
  fullTime: z.object({
    home: z.number().nullable(),
    away: z.number().nullable(),
  }),
});

const fdMatch = z.object({
  id: z.number(),
  utcDate: z.string(),
  status: z.string(),
  stage: z.string(),
  group: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  homeTeam: fdTeamRef,
  awayTeam: fdTeamRef,
  score: fdScore,
});

export const fdMatchesResponse = z.object({
  matches: z.array(fdMatch),
});

const fdTeam = z.object({
  id: z.number(),
  name: z.string(),
  tla: z.string().nullable().optional(),
  crest: z.string().nullable().optional(),
  area: z
    .object({
      name: z.string().nullable().optional(),
      code: z.string().nullable().optional(),
    })
    .optional(),
});

export const fdTeamsResponse = z.object({
  teams: z.array(fdTeam),
});

const fdStandingGroup = z.object({
  stage: z.string(),
  type: z.string(),
  group: z.string().nullable().optional(),
  table: z.array(
    z.object({
      position: z.number().nullable().optional(),
      team: fdTeamRef,
    }),
  ),
});

export const fdStandingsResponse = z.object({
  standings: z.array(fdStandingGroup),
});

export type FdMatch = z.infer<typeof fdMatch>;
export type FdTeam = z.infer<typeof fdTeam>;
export type FdTeamRef = z.infer<typeof fdTeamRef>;
export type FdStandingsResponse = z.infer<typeof fdStandingsResponse>;
