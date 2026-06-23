import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { showNotification } from '@/lib/notifications';
import type { Match, MatchStatus, Team } from '@/types/domain';

function teamName(teams: Record<string, Team>, id: string | null): string {
  if (!id) return 'TBD';
  return teams[id]?.name ?? id;
}

function notifyTransition(m: Match, teams: Record<string, Team>): void {
  const home = teamName(teams, m.homeTeamId);
  const away = teamName(teams, m.awayTeamId);
  const group = m.group ? `Group ${m.group}` : '';

  if (m.status === 'live') {
    showNotification(
      `🔴 Kick-off: ${home} vs ${away}`,
      [group, "the match is under way"].filter(Boolean).join(' · '),
      `live-${m.id}`,
    );
  } else if (m.status === 'finished' && m.score) {
    showNotification(
      `Full time: ${home} ${m.score.home}–${m.score.away} ${away}`,
      [group, 'final score'].filter(Boolean).join(' · '),
      `ft-${m.id}`,
    );
  }
}

/**
 * Watches the fixtures for status changes and raises a browser notification when
 * a match the user opted into goes live or finishes. The first populated snapshot
 * is taken as a silent baseline, so the wall of already-finished group games from
 * the initial load never backfills as alerts — only changes from here on fire.
 */
export function useMatchNotifications(): void {
  const matches = useStore((s) => s.matches);
  const teams = useStore((s) => s.teams);
  const enabled = useStore((s) => s.notificationsEnabled);

  const prevStatus = useRef<Map<string, MatchStatus>>(new Map());
  const seeded = useRef(false);

  useEffect(() => {
    if (matches.length === 0) return;

    if (!seeded.current) {
      for (const m of matches) prevStatus.current.set(m.id, m.status);
      seeded.current = true;
      return;
    }

    for (const m of matches) {
      const before = prevStatus.current.get(m.id);
      if (before !== m.status) {
        if (enabled) notifyTransition(m, teams);
        prevStatus.current.set(m.id, m.status);
      }
    }
  }, [matches, enabled, teams]);
}
