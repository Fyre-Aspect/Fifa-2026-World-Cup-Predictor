import type { Match, MatchScore, MatchStage, MatchStatus } from '@/types/domain';
import { ELO_SEED } from '@/model/eloSeed';
import { squadGoalFactor } from '@/model/squad';
import { groupStandings } from '@/lib/standings';
import { HOST_CITIES } from './cities';

/**
 * A fully generated mock tournament: eight groups of four playing a real
 * round-robin, plus a knockout tree seeded from the projected group standings.
 *
 * The schedule is anchored to the current time rather than fixed calendar dates,
 * so the app always presents a believable "tournament in progress" — matchdays 1
 * and 2 already played, matchday 3 live or imminent (including Portugal v
 * Uzbekistan kicking off today), and the knockouts still to come. Results for
 * played matches are synthesised deterministically from team strength + squad
 * quality, so the standings are self-consistent with the prediction model.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** A match counts as live for this long after kickoff. */
const LIVE_MS = 110 * 60_000;
const HOME_ADVANTAGE = 35;

/** Group order matters: it fixes the round-robin pairings (see MATCHDAYS). */
const GROUP_TEAMS: Record<string, [string, string, string, string]> = {
  A: ['ARG', 'MEX', 'POL', 'JOR'],
  B: ['FRA', 'DEN', 'SEN', 'IRQ'],
  C: ['BRA', 'URU', 'CMR', 'NZL'],
  D: ['ENG', 'USA', 'TUN', 'IRN'],
  E: ['ESP', 'CRO', 'JPN', 'CRC'],
  F: ['POR', 'KOR', 'GHA', 'UZB'],
  G: ['NED', 'ECU', 'EGY', 'QAT'],
  H: ['GER', 'BEL', 'SUI', 'NGA'],
};

const GROUP_LETTERS = Object.keys(GROUP_TEAMS);

/** Round-robin for [a,b,c,d]: each matchday is two pairings by index. */
const MATCHDAYS: Array<Array<[number, number]>> = [
  [[0, 1], [2, 3]], // MD1
  [[0, 2], [3, 1]], // MD2
  [[0, 3], [1, 2]], // MD3 — group F's [0,3] is Portugal v Uzbekistan
];

// ---- Deterministic result synthesis -----------------------------------

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function eloExpected(home: string, away: string): number {
  const eh = (ELO_SEED[home] ?? 1500) + HOME_ADVANTAGE;
  const ea = ELO_SEED[away] ?? 1500;
  return 1 / (1 + Math.pow(10, -(eh - ea) / 400));
}

/** Expected goals for each side — Elo supremacy shaped by squad quality. */
function expectedGoals(home: string, away: string): { home: number; away: number } {
  const e = eloExpected(home, away);
  const base = 2.6;
  const sup = 0.7;
  const h = base * (0.5 + sup * (e - 0.5)) * squadGoalFactor(home, away);
  const a = base * (0.5 - sup * (e - 0.5)) * squadGoalFactor(away, home);
  return { home: Math.max(0.25, h), away: Math.max(0.25, a) };
}

function finalScore(id: string, home: string, away: string): MatchScore {
  const xg = expectedGoals(home, away);
  const goals = (xgi: number, side: string) =>
    Math.max(0, Math.round(xgi + (hash01(id + side) - 0.5) * 1.7));
  return { home: goals(xg.home, 'H'), away: goals(xg.away, 'A') };
}

function liveScore(home: string, away: string, frac: number): MatchScore {
  const xg = expectedGoals(home, away);
  return {
    home: Math.round(xg.home * frac),
    away: Math.round(xg.away * frac),
  };
}

// ---- Builders ----------------------------------------------------------

interface Building {
  id: string;
  stage: MatchStage;
  group: string | null;
  home: string | null;
  away: string | null;
  kickoffMs: number;
  cityId: string;
}

function resolve(b: Building, now: number): Match {
  let status: MatchStatus = 'scheduled';
  let score: MatchScore | null = null;
  let minute: number | null = null;

  if (b.home && b.away) {
    if (b.kickoffMs + LIVE_MS < now) {
      status = 'finished';
      score = finalScore(b.id, b.home, b.away);
    } else if (b.kickoffMs <= now) {
      status = 'live';
      const frac = Math.min(0.98, Math.max(0.05, (now - b.kickoffMs) / LIVE_MS));
      score = liveScore(b.home, b.away, frac);
      minute = Math.min(90, Math.round(frac * 90) + 1);
    }
  }

  return {
    id: b.id,
    stage: b.stage,
    group: b.group,
    kickoff: new Date(b.kickoffMs).toISOString(),
    cityId: b.cityId,
    homeTeamId: b.home,
    awayTeamId: b.away,
    status,
    score,
    minute,
  };
}

function city(i: number): string {
  return HOST_CITIES[i % HOST_CITIES.length].id;
}

function eloSorted(teamIds: readonly string[]): string[] {
  return [...teamIds].sort((a, b) => (ELO_SEED[b] ?? 1500) - (ELO_SEED[a] ?? 1500));
}

export function buildMockBracket(): Match[] {
  const now = Date.now();
  const building: Building[] = [];
  let cityIdx = 0;

  // ---- Group stage --------------------------------------------------
  GROUP_LETTERS.forEach((letter, g) => {
    const teams = GROUP_TEAMS[letter];
    MATCHDAYS.forEach((pairings, md) => {
      pairings.forEach(([hi, ai], slot) => {
        const home = teams[hi];
        const away = teams[ai];

        // Matchday timing: MD1 ~9d ago, MD2 ~5d ago, MD3 around now.
        let kickoffMs: number;
        if (md === 0) kickoffMs = now - 9 * DAY + (g * 5 + slot * 2) * HOUR;
        else if (md === 1) kickoffMs = now - 5 * DAY + (g * 5 + slot * 2) * HOUR;
        else kickoffMs = now + (g - 5) * 16 * HOUR + slot * 3 * HOUR;

        // The headline live game: Portugal v Uzbekistan, in progress right now.
        if (home === 'POR' && away === 'UZB') kickoffMs = now - 35 * 60_000;

        building.push({
          id: `G-${letter}${md + 1}-${slot + 1}`,
          stage: 'group',
          group: letter,
          home,
          away,
          kickoffMs,
          cityId: city(cityIdx++),
        });
      });
    });
  });

  // ---- Projected qualifiers from current standings ------------------
  const groupMatches = building.map((b) => resolve(b, now));
  const first: Record<string, string> = {};
  const second: Record<string, string> = {};
  for (const letter of GROUP_LETTERS) {
    const table = groupStandings(
      groupMatches.filter((m) => m.group === letter),
      eloSorted(GROUP_TEAMS[letter]),
    );
    first[letter] = table[0].teamId;
    second[letter] = table[1].teamId;
  }

  // ---- Round of 16 (seeded from projected standings) ----------------
  const R16_PAIRS: Array<[string, string]> = [
    [first.A, second.B],
    [first.C, second.D],
    [first.E, second.F],
    [first.G, second.H],
    [first.B, second.A],
    [first.D, second.C],
    [first.F, second.E],
    [first.H, second.G],
  ];
  R16_PAIRS.forEach(([home, away], i) => {
    building.push({
      id: `R16-${i + 1}`,
      stage: 'round16',
      group: null,
      home,
      away,
      kickoffMs: now + (5 + Math.floor(i / 2)) * DAY + (i % 2) * 4 * HOUR,
      cityId: city(cityIdx++),
    });
  });

  // ---- Later rounds: teams TBD until the knockouts are projected ----
  const later: Array<{ id: string; stage: MatchStage; day: number }> = [
    { id: 'QF-1', stage: 'quarter', day: 11 },
    { id: 'QF-2', stage: 'quarter', day: 11 },
    { id: 'QF-3', stage: 'quarter', day: 12 },
    { id: 'QF-4', stage: 'quarter', day: 12 },
    { id: 'SF-1', stage: 'semi', day: 15 },
    { id: 'SF-2', stage: 'semi', day: 16 },
    { id: 'TP', stage: 'third', day: 18 },
    { id: 'FIN', stage: 'final', day: 19 },
  ];
  later.forEach((m, i) => {
    building.push({
      id: m.id,
      stage: m.stage,
      group: null,
      home: null,
      away: null,
      kickoffMs: now + m.day * DAY + (i % 2) * 3 * HOUR,
      cityId: city(cityIdx++),
    });
  });

  return building.map((b) => resolve(b, now));
}

export { GROUP_TEAMS, GROUP_LETTERS };
