import type { Match, MatchScore, MatchStage } from '@/types/domain';
import { ELO_SEED } from '@/model/eloSeed';
import { groupStandings, type StandingRow } from '@/lib/standings';
import { realResultFor } from './realResults';
import { HOST_CITIES } from './cities';

/**
 * The real 2026 World Cup as a dataset: the twelve groups of the official final
 * draw, with actual group-stage results from src/data/realResults.ts, plus a
 * knockout tree (Round of 32 ➝ final) seeded from the resulting standings.
 *
 * No scores are invented here. A fixture with a captured real result shows that
 * result (Portugal v Uzbekistan is live at 4–0); a fixture without one is shown
 * as upcoming with a model prediction. The schedule is anchored to the current
 * time so played games sit in the past, the live game is in progress now, and
 * remaining games are in the future — keeping the live UI working regardless of
 * when the app is opened. For continuously updating data, wire the football API.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Twelve groups, teams in final-draw order (position 1–4). */
const GROUP_TEAMS: Record<string, [string, string, string, string]> = {
  A: ['MEX', 'RSA', 'KOR', 'CZE'],
  B: ['CAN', 'BIH', 'QAT', 'SUI'],
  C: ['BRA', 'MAR', 'HAI', 'SCO'],
  D: ['USA', 'PAR', 'AUS', 'TUR'],
  E: ['GER', 'CUW', 'CIV', 'ECU'],
  F: ['NED', 'JPN', 'SWE', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'],
  H: ['ESP', 'CPV', 'KSA', 'URU'],
  I: ['FRA', 'SEN', 'IRQ', 'NOR'],
  J: ['ARG', 'ALG', 'AUT', 'JOR'],
  K: ['POR', 'COD', 'UZB', 'COL'],
  L: ['ENG', 'CRO', 'GHA', 'PAN'],
};

const GROUP_LETTERS = Object.keys(GROUP_TEAMS);

/** Round-robin for [a,b,c,d], three matchdays of two fixtures each. */
const MATCHDAYS: Array<Array<[number, number]>> = [
  [[0, 1], [2, 3]], // MD1
  [[0, 2], [3, 1]], // MD2
  [[0, 3], [1, 2]], // MD3
];

function city(i: number): string {
  return HOST_CITIES[i % HOST_CITIES.length].id;
}

function eloSorted(teamIds: readonly string[]): string[] {
  return [...teamIds].sort((a, b) => (ELO_SEED[b] ?? 1500) - (ELO_SEED[a] ?? 1500));
}

// ---- Knockout seeding --------------------------------------------------

interface Seed {
  teamId: string;
  group: string;
  points: number;
  gd: number;
  gf: number;
}

function toSeed(row: StandingRow, group: string): Seed {
  return { teamId: row.teamId, group, points: row.points, gd: row.goalDifference, gf: row.goalsFor };
}

function cmpSeed(a: Seed, b: Seed): number {
  return (
    b.points - a.points ||
    b.gd - a.gd ||
    b.gf - a.gf ||
    (ELO_SEED[b.teamId] ?? 1500) - (ELO_SEED[a.teamId] ?? 1500)
  );
}

export function buildMockBracket(): Match[] {
  const now = Date.now();
  const matches: Match[] = [];
  let cityIdx = 0;

  // ---- Group stage: real results where known, otherwise upcoming ----
  GROUP_LETTERS.forEach((letter, g) => {
    const teams = GROUP_TEAMS[letter];
    MATCHDAYS.forEach((pairings, md) => {
      pairings.forEach(([hi, ai], slot) => {
        const home = teams[hi];
        const away = teams[ai];
        const real = realResultFor(home, away);

        let kickoffMs: number;
        let score: MatchScore | null = null;
        let status: Match['status'] = 'scheduled';
        let minute: number | null = null;

        if (real?.status === 'live') {
          status = 'live';
          score = { home: real.home, away: real.away };
          minute = real.minute;
          kickoffMs = now - (real.minute ?? 50) * 60_000;
        } else if (real?.status === 'finished') {
          status = 'finished';
          score = { home: real.home, away: real.away };
          kickoffMs = now - (md === 0 ? 9 : 4) * DAY + (g * 2 + slot) * HOUR;
        } else {
          // No captured result — genuinely upcoming, shown with a prediction.
          kickoffMs = now + (md + 1) * DAY + (g * 2 + slot) * HOUR;
        }

        matches.push({
          id: `G-${letter}${md + 1}-${slot + 1}`,
          stage: 'group',
          group: letter,
          kickoff: new Date(kickoffMs).toISOString(),
          cityId: city(cityIdx++),
          homeTeamId: home,
          awayTeamId: away,
          status,
          score,
          minute,
        });
      });
    });
  });

  // ---- Projected qualifiers from the standings so far ---------------
  const winners: Seed[] = [];
  const runners: Seed[] = [];
  const thirds: Seed[] = [];
  for (const letter of GROUP_LETTERS) {
    const table = groupStandings(
      matches.filter((m) => m.group === letter),
      eloSorted(GROUP_TEAMS[letter]),
    );
    winners.push(toSeed(table[0], letter));
    runners.push(toSeed(table[1], letter));
    thirds.push(toSeed(table[2], letter));
  }
  winners.sort(cmpSeed);
  runners.sort(cmpSeed);
  thirds.sort(cmpSeed);
  const bestThirds = thirds.slice(0, 8);

  // Standard bracket seeding: best seed vs worst, avoiding same-group ties.
  const seeded = [...winners, ...runners, ...bestThirds];
  const homes = seeded.slice(0, 16);
  const aways = seeded.slice(16).reverse();
  for (let i = 0; i < 16; i++) {
    if (homes[i].group !== aways[i].group) continue;
    for (let j = 0; j < 16; j++) {
      if (j === i) continue;
      if (homes[i].group !== aways[j].group && homes[j].group !== aways[i].group) {
        [aways[i], aways[j]] = [aways[j], aways[i]];
        break;
      }
    }
  }

  // ---- Round of 32 (projected from current standings) ---------------
  for (let i = 0; i < 16; i++) {
    matches.push({
      id: `R32-${i + 1}`,
      stage: 'round32',
      group: null,
      kickoff: new Date(now + (5 + Math.floor(i / 4)) * DAY + (i % 2) * 4 * HOUR).toISOString(),
      cityId: city(cityIdx++),
      homeTeamId: homes[i].teamId,
      awayTeamId: aways[i].teamId,
      status: 'scheduled',
      score: null,
      minute: null,
    });
  }

  // ---- Later rounds: teams TBD until the knockouts are projected ----
  const later: Array<{ prefix: string; stage: MatchStage; count: number; day: number }> = [
    { prefix: 'R16', stage: 'round16', count: 8, day: 10 },
    { prefix: 'QF', stage: 'quarter', count: 4, day: 13 },
    { prefix: 'SF', stage: 'semi', count: 2, day: 16 },
    { prefix: 'TP', stage: 'third', count: 1, day: 18 },
    { prefix: 'FIN', stage: 'final', count: 1, day: 19 },
  ];
  for (const round of later) {
    for (let i = 0; i < round.count; i++) {
      matches.push({
        id: round.count === 1 ? round.prefix : `${round.prefix}-${i + 1}`,
        stage: round.stage,
        group: null,
        kickoff: new Date(now + round.day * DAY + i * 4 * HOUR).toISOString(),
        cityId: city(cityIdx++),
        homeTeamId: null,
        awayTeamId: null,
        status: 'scheduled',
        score: null,
        minute: null,
      });
    }
  }

  return matches;
}

export { GROUP_TEAMS, GROUP_LETTERS };
