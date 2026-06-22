import type { Match, MatchPrediction, Team } from '@/types/domain';

export interface Contender {
  team: Team;
  /** Estimated share of title odds in [0, 1]. */
  probability: number;
}

const STAGE_WEIGHT: Record<Match['stage'], number> = {
  group: 1,
  round32: 1.6,
  round16: 2.2,
  quarter: 3,
  semi: 4,
  final: 5,
  third: 0.5,
};

/**
 * A lightweight title-odds estimate: weight each team's per-match advance
 * probability (win + half of draw) by how deep the match sits in the bracket,
 * sum per team, and normalize to a share. This is intentionally an
 * approximation — a full bracket Monte Carlo is future work — and is always
 * surfaced as a "model estimate", never as fact.
 *
 * Returns an empty list when no predictions exist yet, so callers can show
 * honest skeletons instead of invented numbers.
 */
export function selectTitleContenders(
  teams: Record<string, Team>,
  matches: Match[],
  predictions: Record<string, MatchPrediction>,
  count: number,
): Contender[] {
  if (Object.keys(predictions).length === 0) return [];

  const scores = new Map<string, number>();
  const add = (teamId: string, value: number) => {
    scores.set(teamId, (scores.get(teamId) ?? 0) + value);
  };

  for (const match of matches) {
    const pred = predictions[match.id];
    if (!pred || !match.homeTeamId || !match.awayTeamId) continue;
    const w = STAGE_WEIGHT[match.stage];
    add(match.homeTeamId, (pred.homeWin + pred.draw / 2) * w);
    add(match.awayTeamId, (pred.awayWin + pred.draw / 2) * w);
  }

  const total = [...scores.values()].reduce((a, b) => a + b, 0);
  if (total <= 0) return [];

  return [...scores.entries()]
    .map(([teamId, score]) => ({ team: teams[teamId], probability: score / total }))
    .filter((c): c is Contender => Boolean(c.team))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, count);
}
