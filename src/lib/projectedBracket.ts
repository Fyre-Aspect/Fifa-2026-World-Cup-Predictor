import type { Match, Team } from '@/types/domain';
import type { EloRatings } from '@/model/elo';
import { ELO_SEED } from '@/model/eloSeed';
import { groupStandings } from './standings';

/**
 * Seeds a *projected* Round of 32 from the current group standings, so the
 * knockout bracket can show a full predicted tree before the real draw has
 * happened (the live feed leaves every knockout slot as TBD until then).
 *
 * It is explicitly a model projection, never presented as the official draw:
 *   1. Take each group's projected top two + the eight best third-placed teams
 *      (32 qualifiers), ranked by current points then a strength prior (Elo).
 *   2. Seed those 32 into a standard single-elimination bracket (1 v 32, etc.)
 *      so stronger sides are spread apart and meet later.
 * The result is fed to `projectKnockouts`, which simulates every later round.
 */

/** Standard 32-slot single-elim seed order: position i faces position i±1. */
const SEED_ORDER_32 = [
  1, 32, 16, 17, 8, 25, 9, 24, 4, 29, 13, 20, 5, 28, 12, 21,
  2, 31, 15, 18, 7, 26, 10, 23, 3, 30, 14, 19, 6, 27, 11, 22,
];

interface ThirdRow {
  teamId: string;
  points: number;
  gd: number;
  gf: number;
}

export function projectedR32Matches(
  matches: Match[],
  teams: Record<string, Team>,
  ratings: EloRatings,
): Match[] {
  const strength = (id: string) => ratings[id] ?? ELO_SEED[id] ?? 1500;

  const groupMatches = matches.filter((m) => m.stage === 'group' && m.group);
  const letters = [...new Set(groupMatches.map((m) => m.group as string))].sort();

  const winners: string[] = [];
  const runners: string[] = [];
  const thirds: ThirdRow[] = [];

  for (const letter of letters) {
    const teamIds = Object.values(teams)
      .filter((t) => t.group === letter)
      .map((t) => t.id)
      .sort((a, b) => strength(b) - strength(a));
    if (teamIds.length < 3) continue;

    const fixtures = groupMatches.filter((m) => m.group === letter);
    const table = groupStandings(fixtures, teamIds);
    if (table[0]) winners.push(table[0].teamId);
    if (table[1]) runners.push(table[1].teamId);
    if (table[2]) {
      thirds.push({
        teamId: table[2].teamId,
        points: table[2].points,
        gd: table[2].goalDifference,
        gf: table[2].goalsFor,
      });
    }
  }

  const bestThirds = thirds
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8)
    .map((t) => t.teamId);

  const qualifiers = [...winners, ...runners, ...bestThirds];
  if (qualifiers.length < 32) return []; // Not enough data yet — caller shows TBD.

  // Rank the 32 qualifiers by strength → seed #1 (strongest) .. #32.
  const seeded = [...new Set(qualifiers)]
    .sort((a, b) => strength(b) - strength(a))
    .slice(0, 32);
  if (seeded.length < 32) return [];

  // Reuse the real R32 fixtures only for their kickoff/venue metadata.
  const templates = matches
    .filter((m) => m.stage === 'round32')
    .sort((a, b) => a.id.localeCompare(b.id));

  const out: Match[] = [];
  for (let i = 0; i < 16; i++) {
    const seedA = SEED_ORDER_32[i * 2];
    const seedB = SEED_ORDER_32[i * 2 + 1];
    const t = templates[i];
    out.push({
      id: `PR32-${String(i + 1).padStart(2, '0')}`,
      stage: 'round32',
      group: null,
      kickoff: t?.kickoff ?? new Date().toISOString(),
      cityId: t?.cityId ?? '',
      homeTeamId: seeded[seedA - 1],
      awayTeamId: seeded[seedB - 1],
      status: 'scheduled',
      score: null,
      minute: null,
    });
  }
  return out;
}

/**
 * Returns the matches array to feed `projectKnockouts` for a *projected* tree:
 * synthetic seeded R32 + the real later-round fixtures (used as templates).
 * If qualifiers can't be determined yet, returns the input unchanged so the
 * caller naturally falls back to the official (TBD) bracket.
 */
export function projectedBracketMatches(
  matches: Match[],
  teams: Record<string, Team>,
  ratings: EloRatings,
): Match[] {
  const r32 = projectedR32Matches(matches, teams, ratings);
  if (r32.length === 0) return matches;
  return [...r32, ...matches.filter((m) => m.stage !== 'round32')];
}
