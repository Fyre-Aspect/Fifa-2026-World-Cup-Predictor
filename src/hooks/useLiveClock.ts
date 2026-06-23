import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

/**
 * In sample-data mode there is no real feed, so the live match clock would sit
 * frozen. This advances the minute of any in-progress sample match (clock only
 * — it never invents goals) so the live UI demonstrably ticks. With live data,
 * the football-data poll in useTournamentData owns updates and this stays idle.
 */
export function useLiveClock(): void {
  const dataSource = useStore((s) => s.dataSource);

  useEffect(() => {
    if (dataSource === 'live') return;
    const id = window.setInterval(() => {
      const { matches, upsertMatch } = useStore.getState();
      for (const m of matches) {
        if (m.status === 'live' && (m.minute ?? 0) < 90) {
          upsertMatch({ ...m, minute: Math.min(90, (m.minute ?? 0) + 1) });
        }
      }
    }, 6000);
    return () => window.clearInterval(id);
  }, [dataSource]);
}
