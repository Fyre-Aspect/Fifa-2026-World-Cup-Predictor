import type { Match, MatchPrediction, MatchStage, ModelWeights } from '@/types/domain';
import type { EloRatings } from '@/model/elo';
import { buildFormTable } from '@/model/form';
import { predictMatch } from '@/model/predict';
import { mostLikelyDecisiveScore, type Scoreline } from '@/model/scoreline';
import { R32_POSITIONS, slotLabel } from './bracketSkeleton';

/**
 * Forward projection of the knockout bracket. The Round of 32 is seeded from the
 * (projected) group standings — those matches already carry teams — and every
 * later round is simulated: the model predicts each tie, the more probable side
 * advances, and the winners are paired into the next round all the way to the
 * final. Pure given (matches, ratings, weights), so it re-runs live whenever the
 * model weights change.
 *
 * Rounds follow the **official FIFA 2026 bracket tree**, not left-to-right
 * adjacency: each later match is fed by two specific earlier matches, and the
 * two halves only cross at the semi-finals. The feeder maps below index into the
 * canonical match order (R32 = matches 73–88, R16 = 89–96, QF = 97–100).
 */
const R16_FEEDERS: ReadonlyArray<readonly [number, number]> = [
  [1, 4], // 89: W74 v W77
  [0, 2], // 90: W73 v W75
  [3, 5], // 91: W76 v W78
  [6, 7], // 92: W79 v W80
  [10, 11], // 93: W83 v W84
  [8, 9], // 94: W81 v W82
  [13, 15], // 95: W86 v W88
  [12, 14], // 96: W85 v W87
];
const QF_FEEDERS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], // 97: W89 v W90
  [4, 5], // 98: W93 v W94
  [2, 3], // 99: W91 v W92
  [6, 7], // 100: W95 v W96
];
const SF_FEEDERS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], // 101: W97 v W98
  [2, 3], // 102: W99 v W100
];

/** Trailing sequence number of an id like `PR32-07` or `R32-7` (→ 7). */
function seqNum(id: string): number {
  const n = parseInt(id.slice(id.lastIndexOf('-') + 1), 10);
  return Number.isFinite(n) ? n : 0;
}

export interface ProjectedTie {
  id: string;
  stage: MatchStage;
  kickoff: string;
  cityId: string;
  homeId: string | null;
  awayId: string | null;
  /** Position label (e.g. "Runner-up A") shown when a slot has no team yet. */
  homeLabel?: string | null;
  awayLabel?: string | null;
  prediction: MatchPrediction | null;
  scoreline: Scoreline | null;
  winnerId: string | null;
  /** True when the tie is projected level after 90' — decided in extra time / penalties. */
  aet: boolean;
}

export interface ProjectedKnockouts {
  round32: ProjectedTie[];
  round16: ProjectedTie[];
  quarter: ProjectedTie[];
  semi: ProjectedTie[];
  final: ProjectedTie | null;
  third: ProjectedTie | null;
  championId: string | null;
}

function loserOf(tie: ProjectedTie): string | null {
  if (!tie.winnerId) return null;
  return tie.winnerId === tie.homeId ? tie.awayId : tie.homeId;
}

/** An empty tie placeholder (no teams, no prediction). */
function emptyTie(id: string, stage: MatchStage): ProjectedTie {
  return {
    id,
    stage,
    kickoff: '',
    cityId: '',
    homeId: null,
    awayId: null,
    homeLabel: null,
    awayLabel: null,
    prediction: null,
    scoreline: null,
    winnerId: null,
    aet: false,
  };
}

/**
 * The official 2026 bracket. The Round of 32 carries its fixed group-position
 * slots ("Winner A", "Runner-up B", "3rd place"); once the group stage is
 * decided, `seededR32` fills those slots with the actual qualified teams (in the
 * same canonical match order). Later rounds stay TBD until the knockouts are
 * played — no projection, no invented matchups. For the "Official" view.
 */
export function officialBracketSkeleton(seededR32: Match[] = []): ProjectedKnockouts {
  const round32 = R32_POSITIONS.map(([home, away], i) => ({
    ...emptyTie(`OFF-R32-${i + 1}`, 'round32' as MatchStage),
    homeId: seededR32[i]?.homeTeamId ?? null,
    awayId: seededR32[i]?.awayTeamId ?? null,
    homeLabel: slotLabel(home),
    awayLabel: slotLabel(away),
  }));
  return {
    round32,
    round16: Array.from({ length: 8 }, (_, i) => emptyTie(`OFF-R16-${i + 1}`, 'round16')),
    quarter: Array.from({ length: 4 }, (_, i) => emptyTie(`OFF-QF-${i + 1}`, 'quarter')),
    semi: Array.from({ length: 2 }, (_, i) => emptyTie(`OFF-SF-${i + 1}`, 'semi')),
    final: emptyTie('OFF-FIN', 'final'),
    third: emptyTie('OFF-TP', 'third'),
    championId: null,
  };
}

export function projectKnockouts(
  matches: Match[],
  ratings: EloRatings,
  weights: ModelWeights,
  storedPredictions: Record<string, MatchPrediction>,
): ProjectedKnockouts {
  const form = buildFormTable(matches);
  const ctx = { ratings, form, weights };
  const now = new Date().toISOString();

  const byStage = (stage: MatchStage) =>
    matches.filter((m) => m.stage === stage).sort((a, b) => a.id.localeCompare(b.id));

  function tie(
    template: Match | undefined,
    fallbackId: string,
    stage: MatchStage,
    homeId: string | null,
    awayId: string | null,
  ): ProjectedTie {
    const id = template?.id ?? fallbackId;
    const kickoff = template?.kickoff ?? now;
    const cityId = template?.cityId ?? '';

    let prediction: MatchPrediction | null = null;
    if (homeId && awayId) {
      prediction =
        storedPredictions[id] ??
        predictMatch(
          {
            id,
            stage,
            group: null,
            kickoff,
            cityId,
            homeTeamId: homeId,
            awayTeamId: awayId,
            status: 'scheduled',
            score: null,
            minute: null,
          },
          ctx,
          now,
        );
    }

    let scoreline: Scoreline | null = null;
    let winnerId: string | null = null;
    let aet = false;
    if (prediction) {
      // A knockout tie always has a winner, so show the most likely *decisive*
      // scoreline for the side that advances — never a draw. The tie is only
      // flagged AET when regulation is projected level (draw is the single most
      // likely outcome), which the winner then edges in extra time / penalties.
      const homeWins = prediction.homeWin >= prediction.awayWin;
      winnerId = homeWins ? homeId : awayId;
      scoreline = mostLikelyDecisiveScore(prediction.xgHome, prediction.xgAway, homeWins);
      aet = prediction.draw >= prediction.homeWin && prediction.draw >= prediction.awayWin;
    }

    return { id, stage, kickoff, cityId, homeId, awayId, prediction, scoreline, winnerId, aet };
  }

  // Round of 32 — teams already seeded onto the stored matches, in canonical
  // match order (73–88) so the bracket-tree feeder indices line up.
  const r32Stored = byStage('round32').sort((a, b) => seqNum(a.id) - seqNum(b.id));
  const round32 = r32Stored.map((m, i) =>
    tie(m, `R32-${i + 1}`, 'round32', m.homeTeamId, m.awayTeamId),
  );

  // Round of 16 — official feeder pairs of R32 winners.
  const r16Stored = byStage('round16');
  const round16 = R16_FEEDERS.map(([a, b], i) =>
    tie(r16Stored[i], `R16-${i + 1}`, 'round16', round32[a]?.winnerId ?? null, round32[b]?.winnerId ?? null),
  );

  // Quarter-finals — official feeder pairs of R16 winners.
  const qfStored = byStage('quarter');
  const quarter = QF_FEEDERS.map(([a, b], i) =>
    tie(qfStored[i], `QF-${i + 1}`, 'quarter', round16[a]?.winnerId ?? null, round16[b]?.winnerId ?? null),
  );

  // Semi-finals — the two bracket halves finally cross here.
  const sfStored = byStage('semi');
  const semi = SF_FEEDERS.map(([a, b], i) =>
    tie(sfStored[i], `SF-${i + 1}`, 'semi', quarter[a]?.winnerId ?? null, quarter[b]?.winnerId ?? null),
  );

  // Final + third-place play-off.
  const final = semi.length === 2 ? tie(byStage('final')[0], 'FIN', 'final', semi[0].winnerId, semi[1].winnerId) : null;
  const third =
    semi.length === 2
      ? tie(byStage('third')[0], 'TP', 'third', loserOf(semi[0]), loserOf(semi[1]))
      : null;

  return {
    round32,
    round16,
    quarter,
    semi,
    final,
    third,
    championId: final?.winnerId ?? null,
  };
}
