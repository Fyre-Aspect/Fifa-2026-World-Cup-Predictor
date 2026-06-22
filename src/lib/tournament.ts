import type { Match, MatchStage } from '@/types/domain';

export const STAGE_LABEL: Record<MatchStage, string> = {
  group: 'Group stage',
  round32: 'Round of 32',
  round16: 'Round of 16',
  quarter: 'Quarter-final',
  semi: 'Semi-final',
  third: 'Third place',
  final: 'Final',
};

/** Bottom-to-top tier index for the 3D bracket (group lowest, final highest). */
export const STAGE_TIER: Record<MatchStage, number> = {
  group: 0,
  round32: 1,
  round16: 2,
  quarter: 3,
  semi: 4,
  third: 4,
  final: 5,
};

export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatKickoffDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function matchesByCity(matches: Match[], cityId: string): Match[] {
  return matches
    .filter((m) => m.cityId === cityId)
    .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));
}

export function matchesByStage(matches: Match[], stage: MatchStage): Match[] {
  return matches.filter((m) => m.stage === stage);
}
