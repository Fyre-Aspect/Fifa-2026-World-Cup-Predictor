import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Flag } from '@/components/ui/Flag';
import { cn } from '@/lib/cn';
import { predictedScoreline } from '@/model/scoreline';
import { formatKickoff } from '@/lib/tournament';
import {
  notifPermission,
  notifSupported,
  requestNotifPermission,
  showNotification,
  todaysMatches,
  type NotifPermission,
} from '@/lib/notifications';
import type { Match, Team } from '@/types/domain';

const STORAGE_KEY = 'gs:notify';

/**
 * Header control for match notifications: a bell that opens a "today" panel
 * listing the games in progress or coming up, and a toggle to opt into browser
 * alerts for when those matches kick off and finish.
 */
export function NotificationBell() {
  const matches = useStore((s) => s.matches);
  const teams = useStore((s) => s.teams);
  const predictions = useStore((s) => s.predictions);
  const enabled = useStore((s) => s.notificationsEnabled);
  const setEnabled = useStore((s) => s.setNotificationsEnabled);

  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<NotifPermission>(notifPermission());

  // Restore the saved preference (only if the browser still grants permission).
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === '1' && notifPermission() === 'granted') {
      setEnabled(true);
    }
  }, [setEnabled]);

  const today = useMemo(() => todaysMatches(matches), [matches]);
  const liveCount = today.filter((m) => m.status === 'live').length;
  const badge = today.length;

  function announceToday() {
    for (const m of today.filter((x) => x.status === 'live').slice(0, 3)) {
      const score = m.score ? `${m.score.home}–${m.score.away}` : '';
      showNotification(
        `🔴 LIVE: ${name(teams, m.homeTeamId)} ${score} ${name(teams, m.awayTeamId)}`.trim(),
        m.minute ? `${m.minute}' · ${m.group ? `Group ${m.group}` : ''}`.trim() : 'In play',
        `live-${m.id}`,
      );
    }
    const upcoming = today.filter((x) => x.status === 'scheduled');
    const summary =
      upcoming.length > 0
        ? `Next up: ${name(teams, upcoming[0].homeTeamId)} vs ${name(teams, upcoming[0].awayTeamId)}`
        : 'You’ll be alerted on kick-off and full time.';
    showNotification(`${badge} match${badge === 1 ? '' : 'es'} today`, summary, 'today-summary');
  }

  async function toggleAlerts() {
    if (!notifSupported()) return;
    if (enabled) {
      setEnabled(false);
      localStorage.setItem(STORAGE_KEY, '0');
      return;
    }
    let p = notifPermission();
    if (p === 'default') p = await requestNotifPermission();
    setPerm(p);
    if (p === 'granted') {
      setEnabled(true);
      localStorage.setItem(STORAGE_KEY, '1');
      announceToday();
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Today's matches & alerts"
        aria-label="Today's matches and notification settings"
        className={cn(
          'interactive relative grid h-9 w-9 place-items-center rounded-lg border transition-colors',
          open || enabled
            ? 'border-gold-400/50 bg-gold-400/10 text-gold-300'
            : 'border-pitch-600/50 bg-pitch-800/60 text-offwhite-dim hover:text-offwhite',
        )}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {badge > 0 && (
          <span
            className={cn(
              'absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-700 text-pitch-950',
              liveCount > 0 ? 'animate-pulse-glow bg-red-400' : 'bg-gold-400',
            )}
          >
            {badge}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              className="surface-raised absolute right-0 top-11 z-50 w-[min(20rem,calc(100vw-2rem))] p-3"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-sm font-600 uppercase tracking-wide text-gold-300">Today</h3>
                <span className="text-[11px] text-offwhite-faint">
                  {liveCount > 0 ? `${liveCount} live` : `${badge} scheduled`}
                </span>
              </div>

              {today.length === 0 ? (
                <p className="px-1 py-3 text-sm text-offwhite-dim">
                  No matches today. We’ll alert you when the next ones start.
                </p>
              ) : (
                <div className="max-h-[44vh] space-y-1 overflow-y-auto">
                  {today.map((m) => (
                    <TodayRow
                      key={m.id}
                      match={m}
                      teams={teams}
                      predicted={
                        m.status === 'scheduled' && predictions[m.id]
                          ? predictedScoreline(predictions[m.id].xgHome, predictions[m.id].xgAway, m.id)
                          : null
                      }
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </div>
              )}

              <div className="mt-2 border-t border-pitch-700/40 pt-2">
                {notifSupported() ? (
                  perm === 'denied' ? (
                    <p className="px-1 text-[11px] text-offwhite-faint">
                      Alerts are blocked. Enable notifications for this site in your browser settings.
                    </p>
                  ) : (
                    <button
                      onClick={toggleAlerts}
                      className={cn(
                        'interactive flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-500',
                        enabled
                          ? 'bg-gold-400/10 text-gold-300'
                          : 'border border-pitch-600/50 bg-pitch-800/60 text-offwhite hover:border-gold-400/40',
                      )}
                    >
                      <span>{enabled ? 'Alerts on — kick-off & full time' : 'Enable match alerts'}</span>
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          enabled ? 'bg-gold-400 shadow-glow-sm' : 'bg-offwhite-faint',
                        )}
                      />
                    </button>
                  )
                ) : (
                  <p className="px-1 text-[11px] text-offwhite-faint">
                    This browser doesn’t support notifications.
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function name(teams: Record<string, Team>, id: string | null): string {
  if (!id) return 'TBD';
  return teams[id]?.name ?? id;
}

function TodayRow({
  match,
  teams,
  predicted,
  onNavigate,
}: {
  match: Match;
  teams: Record<string, Team>;
  predicted: { home: number; away: number } | null;
  onNavigate: () => void;
}) {
  const home = match.homeTeamId ? teams[match.homeTeamId] : undefined;
  const away = match.awayTeamId ? teams[match.awayTeamId] : undefined;
  const live = match.status === 'live';

  return (
    <Link
      to={`/match/${match.id}`}
      onClick={onNavigate}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-pitch-700/40"
    >
      <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5 truncate text-right text-offwhite-dim">
        <span className="truncate">{home?.name ?? 'TBD'}</span>
        <Flag code={home?.flagCode} title={home?.name} className="h-3 w-5 shrink-0" />
      </span>
      <span
        className={cn(
          'display-num shrink-0 rounded px-1.5 py-0.5 text-[11px] font-700',
          live ? 'bg-red-500/15 text-red-300' : 'bg-pitch-900/60 text-offwhite',
        )}
      >
        {live && match.score
          ? `${match.score.home}–${match.score.away}`
          : predicted
            ? `${predicted.home}–${predicted.away}`
            : 'vs'}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-offwhite-dim">
        <Flag code={away?.flagCode} title={away?.name} className="h-3 w-5 shrink-0" />
        <span className="truncate">{away?.name ?? 'TBD'}</span>
      </span>
      <span className="hidden shrink-0 text-[10px] text-offwhite-faint sm:block">
        {live ? `${match.minute ?? ''}'` : formatKickoff(match.kickoff)}
      </span>
    </Link>
  );
}
