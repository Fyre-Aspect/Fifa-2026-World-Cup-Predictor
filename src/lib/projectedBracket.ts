import type { Match, Team } from '@/types/domain';
import type { EloRatings } from '@/model/elo';
import { ELO_SEED } from '@/model/eloSeed';
import { groupStandings } from './standings';
import { R32_POSITIONS } from './bracketSkeleton';

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

  // Prefer the *real* official draw when the API has published it: once the
  // knockout fixtures exist, they carry the actual matchups (and, once played,
  // real scores/winners), including the true third-place allocation — which our
  // greedy `assignThirds` only approximates. We trust those fixtures only when
  // they demonstrably encode the official bracket: every determined slot (both
  // sides a fixed winner/runner) must appear as a real fixture. Otherwise (e.g.
  // the bundled mock's generic strength seed) we fall back to seeding onto the
  // skeleton ourselves, so the projected tree still follows FIFA's shape.
  const realR32 = matches.filter(
    (m) => m.stage === 'round32' && m.homeTeamId && m.awayTeamId,
  );
  const drawn = realDrawR32(realR32, resolve);
  if (drawn) return drawn;

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
 * If the supplied Round-of-32 fixtures encode the *official* 2026 draw, returns
 * them in canonical slot order (matches 73–88), oriented so the fixed
 * winner/runner side is home; otherwise returns null so the caller seeds the
 * skeleton itself.
 *
 * The check: every fully-determined slot (both sides a fixed winner/runner, no
 * third-place placeholder) must be present as a real fixture pairing exactly
 * those two teams. Generic seedings (the mock) won't satisfy this, so we never
 * mistake them for the real draw.
 */
function realDrawR32(
  realR32: Match[],
  resolve: (code: string, host: string) => string | null,
): Match[] | null {
  const byTeam = new Map<string, Match>();
  for (const m of realR32) {
    if (m.homeTeamId) byTeam.set(m.homeTeamId, m);
    if (m.awayTeamId) byTeam.set(m.awayTeamId, m);
  }

  const teamsOf = (m: Match) => new Set([m.homeTeamId, m.awayTeamId]);

  for (const [homeCode, awayCode] of R32_POSITIONS) {
    if (homeCode === '3' || awayCode === '3') continue; // third slots verified via their host
    const home = resolve(homeCode, '');
    const away = resolve(awayCode, '');
    if (!home || !away) return null;
    const fx = byTeam.get(home);
    if (!fx || !teamsOf(fx).has(away)) return null; // not the official draw
  }

  // Confirmed: build every slot from its real fixture, keyed by the fixed
  // winner/runner side (the home code is always `1x`/`2x`, never `3`).
  const out: Match[] = [];
  for (const [homeCode] of R32_POSITIONS) {
    const host = homeCode[0] === '1' ? homeCode.slice(1) : '';
    const anchor = resolve(homeCode, host);
    const fx = anchor ? byTeam.get(anchor) : undefined;
    if (!fx) return null; // an expected qualifier has no fixture — bail to seeding
    out.push(orientHome(fx, anchor));
  }
  return out;
}

/** Returns the match with `anchor` as the home side (swapping score/winner if needed). */
function orientHome(m: Match, anchor: string | null): Match {
  if (!anchor || m.homeTeamId === anchor) return m;
  return {
    ...m,
    homeTeamId: m.awayTeamId,
    awayTeamId: m.homeTeamId,
    score: m.score ? { home: m.score.away, away: m.score.home } : null,
    penalties: m.penalties ? { home: m.penalties.away, away: m.penalties.home } : null,
    winner: m.winner === 'home' ? 'away' : m.winner === 'away' ? 'home' : m.winner,
  };
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
