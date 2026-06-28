import type { Match, Team } from '@/types/domain';
import type { EloRatings } from '@/model/elo';
import { ELO_SEED } from '@/model/eloSeed';
import { groupStandings } from './standings';

/**
 * Seeds a *projected* Round of 32 onto the **official FIFA 2026 bracket
 * skeleton**, so the predicted tree matches the real one's shape rather than a
 * generic strength seed.
 *
 * The 2026 bracket is fixed by group position (no redraw): each of the 16
 * Round-of-32 slots is a specific group finish — e.g. match 73 is 2A v 2B, match
 * 74 is 1E v a third-placed team. We fill those slots from the projected group
 * standings (winners, runners-up, and the eight best third-placed teams), so the
 * matchups and every team's route to the final line up with FIFA's bracket.
 *
 * It remains explicitly a model projection, never the official draw: the
 * third-place *allocation* (which third faces which group winner) follows FIFA's
 * same-group-avoidance rule rather than the full 495-row combination table.
 */

/**
 * Official Round-of-32 pairings, matches 73–88 in order. Codes: `1x` = winner of
 * group x, `2x` = runner-up of group x, `3` = a third-placed team. This order is
 * canonical — `projectKnockouts` walks the real bracket tree over these indices.
 */
const R32_POSITIONS: ReadonlyArray<readonly [string, string]> = [
  ['2A', '2B'], // 73
  ['1E', '3'], //  74
  ['1F', '2C'], // 75
  ['1C', '2F'], // 76
  ['1I', '3'], //  77
  ['2E', '2I'], // 78
  ['1A', '3'], //  79
  ['1L', '3'], //  80
  ['1D', '3'], //  81
  ['1G', '3'], //  82
  ['2K', '2L'], // 83
  ['1H', '2J'], // 84
  ['1B', '3'], //  85
  ['1J', '2H'], // 86
  ['1K', '3'], //  87
  ['2D', '2G'], // 88
];

interface ThirdRow {
  teamId: string;
  group: string;
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

  const winners: Record<string, string> = {};
  const runners: Record<string, string> = {};
  const thirds: ThirdRow[] = [];

  for (const letter of letters) {
    const teamIds = Object.values(teams)
      .filter((t) => t.group === letter)
      .map((t) => t.id)
      .sort((a, b) => strength(b) - strength(a));
    if (teamIds.length < 3) continue;

    const fixtures = groupMatches.filter((m) => m.group === letter);
    const table = groupStandings(fixtures, teamIds);
    if (table[0]) winners[letter] = table[0].teamId;
    if (table[1]) runners[letter] = table[1].teamId;
    if (table[2]) {
      thirds.push({
        teamId: table[2].teamId,
        group: letter,
        points: table[2].points,
        gd: table[2].goalDifference,
        gf: table[2].goalsFor,
      });
    }
  }

  // Need a complete picture (all 12 winners + runners and 8 thirds) to seed the
  // full official skeleton; otherwise let the caller fall back to the TBD bracket.
  if (Object.keys(winners).length < 12 || Object.keys(runners).length < 12 || thirds.length < 8) {
    return [];
  }

  const bestThirds = thirds
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8);

  // The eight "3" slots, in match order, are hosted by these group winners.
  const thirdHosts = ['E', 'I', 'A', 'L', 'D', 'G', 'B', 'K'];
  const thirdForHost = assignThirds(bestThirds, thirdHosts);

  // Reuse the real R32 fixtures only for their kickoff/venue metadata.
  const templates = matches
    .filter((m) => m.stage === 'round32')
    .sort((a, b) => a.id.localeCompare(b.id));

  const resolve = (code: string, host: string): string | null => {
    if (code === '3') return thirdForHost[host] ?? null;
    const letter = code.slice(1);
    return code[0] === '1' ? (winners[letter] ?? null) : (runners[letter] ?? null);
  };

  const out: Match[] = [];
  for (let i = 0; i < 16; i++) {
    const [homeCode, awayCode] = R32_POSITIONS[i];
    // The host group only matters for the third slot; the winner is the partner.
    const host = homeCode[0] === '1' ? homeCode.slice(1) : '';
    const t = templates[i];
    out.push({
      id: `PR32-${String(i + 1).padStart(2, '0')}`,
      stage: 'round32',
      group: null,
      kickoff: t?.kickoff ?? new Date().toISOString(),
      cityId: t?.cityId ?? '',
      homeTeamId: resolve(homeCode, host),
      awayTeamId: resolve(awayCode, host),
      status: 'scheduled',
      score: null,
      minute: null,
    });
  }
  return out;
}

/**
 * Allocates the eight best third-placed teams to the eight third slots, each
 * hosted by a group winner. Mirrors FIFA's one hard rule — a third can't be
 * drawn against a side from its own group — by greedily giving each slot the
 * strongest remaining third from a different group.
 */
function assignThirds(thirds: ThirdRow[], hosts: string[]): Record<string, string> {
  const pool = [...thirds];
  const assigned: Record<string, string> = {};
  for (const host of hosts) {
    let pick = pool.findIndex((t) => t.group !== host);
    if (pick === -1) pick = 0; // only same-group left — unavoidable, take it
    assigned[host] = pool[pick].teamId;
    pool.splice(pick, 1);
  }
  return assigned;
}

/**
 * Returns the matches array to feed `projectKnockouts` for a *projected* tree:
 * the official-skeleton seeded R32 + the real later-round fixtures (templates).
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
