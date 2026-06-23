import type { Match } from '@/types/domain';

/** One team's row in a group table. */
export interface StandingRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** True once this side has a result counted (helps the UI dim untouched rows). */
  hasPlayed: boolean;
}

function emptyRow(teamId: string): StandingRow {
  return {
    teamId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    hasPlayed: false,
  };
}

/**
 * Build a group table from its matches. `teamIds` seeds the order so teams that
 * haven't played yet still appear, and ties (e.g. before kickoff) resolve to the
 * caller's preferred order — pass teams pre-sorted by strength for a sensible
 * provisional ranking. Both live and finished scores count toward the table.
 */
export function groupStandings(matches: Match[], teamIds: string[]): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  for (const id of teamIds) rows.set(id, emptyRow(id));

  for (const m of matches) {
    if (!m.score || !m.homeTeamId || !m.awayTeamId) continue;
    if (m.status !== 'finished' && m.status !== 'live') continue;
    const home = rows.get(m.homeTeamId) ?? emptyRow(m.homeTeamId);
    const away = rows.get(m.awayTeamId) ?? emptyRow(m.awayTeamId);
    rows.set(m.homeTeamId, home);
    rows.set(m.awayTeamId, away);

    home.played += 1;
    away.played += 1;
    home.goalsFor += m.score.home;
    home.goalsAgainst += m.score.away;
    away.goalsFor += m.score.away;
    away.goalsAgainst += m.score.home;
    home.hasPlayed = true;
    away.hasPlayed = true;

    if (m.score.home > m.score.away) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (m.score.home < m.score.away) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const row of rows.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  // Preserve the seeded order as the final tie-break (stable sort).
  const ordered = teamIds
    .map((id) => rows.get(id))
    .filter((r): r is StandingRow => !!r);

  return ordered.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor,
  );
}
