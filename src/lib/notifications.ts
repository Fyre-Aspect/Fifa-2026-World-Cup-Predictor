import type { Match } from '@/types/domain';

/**
 * Thin wrapper around the browser Web Notifications API plus the match-status
 * helpers the bell and the watcher hook share. Everything degrades gracefully:
 * on a browser without Notification support, or with permission denied, the show
 * calls simply no-op.
 */

export type NotifPermission = NotificationPermission | 'unsupported';

export function notifSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notifPermission(): NotifPermission {
  if (!notifSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotifPermission(): Promise<NotifPermission> {
  if (!notifSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Show a notification, no-op unless supported and granted. `tag` de-dupes. */
export function showNotification(title: string, body: string, tag?: string): void {
  if (!notifSupported() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag, icon: '/favicon.svg', badge: '/favicon.svg' });
  } catch {
    // Some browsers throw if called outside a user gesture / SW context — ignore.
  }
}

const SOON_MS = 3 * 60 * 60 * 1000; // "kicking off soon" window: 3 hours

/** Classify a match for notification purposes relative to `now`. */
export function matchSignal(m: Match, now = Date.now()): 'live' | 'finished' | 'soon' | null {
  if (m.status === 'live') return 'live';
  if (m.status === 'finished') return 'finished';
  if (m.status === 'scheduled') {
    const t = Date.parse(m.kickoff);
    if (t > now && t - now <= SOON_MS) return 'soon';
  }
  return null;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Matches that are live now, or scheduled to kick off later today. */
export function todaysMatches(matches: Match[], now = new Date()): Match[] {
  return matches
    .filter((m) => {
      if (m.status === 'live') return true;
      if (m.status === 'scheduled') return sameDay(new Date(m.kickoff), now);
      return false;
    })
    .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));
}
