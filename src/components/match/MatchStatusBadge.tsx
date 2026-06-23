import { cn } from '@/lib/cn';
import type { MatchStatus } from '@/types/domain';

/**
 * The single source of truth for how a match's state reads across the app:
 * Live (red, pulsing, with the clock), Full time (settled), or Upcoming (gold).
 */
export function MatchStatusBadge({
  status,
  minute,
  className,
}: {
  status: MatchStatus;
  minute?: number | null;
  className?: string;
}) {
  if (status === 'live') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-700 uppercase tracking-wide text-red-300',
          className,
        )}
      >
        <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-red-400" />
        {minute ? `${minute}'` : 'Live'}
      </span>
    );
  }
  if (status === 'finished') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-pitch-600/40 px-2 py-0.5 text-[10px] font-600 uppercase tracking-wide text-offwhite-dim',
          className,
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
        Full time
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gold-400/10 px-2 py-0.5 text-[10px] font-600 uppercase tracking-wide text-gold-300',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
      Upcoming
    </span>
  );
}

/** A bare status dot for tight rows — colour-codes Live / Done / Upcoming. */
export function StatusDot({ status, className }: { status: MatchStatus; className?: string }) {
  return (
    <span
      title={status === 'live' ? 'Live now' : status === 'finished' ? 'Full time' : 'Upcoming'}
      className={cn(
        'inline-block h-2 w-2 shrink-0 rounded-full',
        status === 'live' && 'animate-pulse-glow bg-red-400',
        status === 'finished' && 'bg-emerald-400/70',
        status === 'scheduled' && 'bg-gold-400',
        className,
      )}
    />
  );
}
