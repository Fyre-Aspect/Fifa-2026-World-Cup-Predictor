import type { Match } from '@/types/domain';

export type ResultChar = 'W' | 'D' | 'L';

export interface FormEntry {
  teamId: string;
  /** Number of matches counted (capped at the window). */
  games: number;
  /** Recency-weighted points share in [0, 1] (1 = all wins). */
  share: number;
  /** Form expressed as an Elo-equivalent offset (positive = good form). */
  signalElo: number;
  /** Most-recent-first list of results, for sparkline display. */
  recent: ResultChar[];
}

const DEFAULT_WINDOW = 10;
const DEFAULT_DECAY = 0.85;
/** Max Elo-equivalent swing from form alone (all wins vs all losses → ±this). */
const FORM_ELO_RANGE = 110;

interface Played {
  date: number;
  points: number; // 1 win, 0.5 draw, 0 loss
  result: ResultChar;
}

/**
 * Builds a recency-weighted form table from finished matches: the last N
 * results per team, with more recent games weighted more heavily. The output
 * `signalElo` plugs straight into the same diff→outcome model the Elo input
 * uses, so the form signal is on a comparable scale.
 */
export function buildFormTable(
  matches: Match[],
  window = DEFAULT_WINDOW,
  decay = DEFAULT_DECAY,
): Record<string, FormEntry> {
  const played = new Map<string, Played[]>();

  const push = (teamId: string, p: Played) => {
    const arr = played.get(teamId) ?? [];
    arr.push(p);
    played.set(teamId, arr);
  };

  for (const m of matches) {
    if (m.status !== 'finished' || !m.score || !m.homeTeamId || !m.awayTeamId) continue;
    const date = Date.parse(m.kickoff);
    const { home, away } = m.score;
    const homeRes: ResultChar = home > away ? 'W' : home < away ? 'L' : 'D';
    const awayRes: ResultChar = away > home ? 'W' : away < home ? 'L' : 'D';
    push(m.homeTeamId, { date, points: home > away ? 1 : home === away ? 0.5 : 0, result: homeRes });
    push(m.awayTeamId, { date, points: away > home ? 1 : away === home ? 0.5 : 0, result: awayRes });
  }

  const table: Record<string, FormEntry> = {};
  for (const [teamId, all] of played) {
    const recentPlayed = all.sort((a, b) => b.date - a.date).slice(0, window);
    let wSum = 0;
    let wPoints = 0;
    recentPlayed.forEach((p, i) => {
      const w = Math.pow(decay, i); // i = 0 is most recent → highest weight
      wSum += w;
      wPoints += w * p.points;
    });
    const share = wSum > 0 ? wPoints / wSum : 0.5;
    table[teamId] = {
      teamId,
      games: recentPlayed.length,
      share,
      signalElo: (share - 0.5) * 2 * FORM_ELO_RANGE,
      recent: recentPlayed.map((p) => p.result),
    };
  }

  return table;
}

export function formSignal(entry: FormEntry | undefined): number {
  return entry?.signalElo ?? 0;
}
