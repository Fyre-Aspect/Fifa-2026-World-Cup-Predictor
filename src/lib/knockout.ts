import type { Match, MatchPrediction, MatchStage, ModelWeights } from '@/types/domain';
import type { EloRatings } from '@/model/elo';
import { buildFormTable } from '@/model/form';
import { predictMatch } from '@/model/predict';
import { mostLikelyScore, type Scoreline } from '@/model/scoreline';

/**
 * Forward projection of the knockout bracket. The Round of 32 is seeded from the
 * (projected) group standings — those matches already carry teams — and every
 * later round is simulated: the model predicts each tie, the more probable side
 * advances, and the winners are paired into the next round all the way to the
 * final. Pure given (matches, ratings, weights), so it re-runs live whenever the
 * model weights change.
 */

export interface ProjectedTie {
  id: string;
  stage: MatchStage;
  kickoff: string;
  cityId: string;
  homeId: string | null;
  awayId: string | null;
  prediction: MatchPrediction | null;
  scoreline: Scoreline | null;
  winnerId: string | null;
  /** True when the modal scoreline is level — decided in extra time / penalties. */
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
      scoreline = mostLikelyScore(prediction.xgHome, prediction.xgAway);
      winnerId = prediction.homeWin >= prediction.awayWin ? homeId : awayId;
      aet = scoreline.home === scoreline.away;
    }

    return { id, stage, kickoff, cityId, homeId, awayId, prediction, scoreline, winnerId, aet };
  }

  // Round of 32 — teams already seeded onto the stored matches.
  const r32Stored = byStage('round32');
  const round32 = r32Stored.map((m, i) =>
    tie(m, `R32-${i + 1}`, 'round32', m.homeTeamId, m.awayTeamId),
  );

  // Round of 16 — pair adjacent R32 winners.
  const r16Stored = byStage('round16');
  const round16: ProjectedTie[] = [];
  for (let i = 0; i < 8; i++) {
    const a = round32[i * 2]?.winnerId ?? null;
    const b = round32[i * 2 + 1]?.winnerId ?? null;
    round16.push(tie(r16Stored[i], `R16-${i + 1}`, 'round16', a, b));
  }

  // Quarter-finals — pair adjacent R16 winners.
  const qfStored = byStage('quarter');
  const quarter: ProjectedTie[] = [];
  for (let i = 0; i < 4; i++) {
    const a = round16[i * 2]?.winnerId ?? null;
    const b = round16[i * 2 + 1]?.winnerId ?? null;
    quarter.push(tie(qfStored[i], `QF-${i + 1}`, 'quarter', a, b));
  }

  // Semi-finals.
  const sfStored = byStage('semi');
  const semi: ProjectedTie[] = [];
  for (let i = 0; i < 2; i++) {
    const a = quarter[i * 2]?.winnerId ?? null;
    const b = quarter[i * 2 + 1]?.winnerId ?? null;
    semi.push(tie(sfStored[i], `SF-${i + 1}`, 'semi', a, b));
  }

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
