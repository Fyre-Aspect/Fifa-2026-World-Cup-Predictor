import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { queryClient } from '@/api/queryClient';
import { cn } from '@/lib/cn';

/**
 * Honest, at-a-glance indicator of where the on-screen data comes from:
 *  • LIVE — pulled from a live provider (API-Football), polling while matches run.
 *  • SNAPSHOT — bundled historical capture; not a live feed.
 *  • CONNECTING — first load in flight.
 * The refresh button re-fetches the live providers (and retries after a snapshot
 * fallback), so a user can pull the latest without reloading the page.
 */
export function DataSourceBadge() {
  const source = useStore((s) => s.dataSource);
  const provider = useStore((s) => s.dataProvider);
  const updatedAt = useStore((s) => s.dataUpdatedAt);
  const [spinning, setSpinning] = useState(false);

  const refresh = () => {
    setSpinning(true);
    queryClient.invalidateQueries({ queryKey: ['tournament'] }).finally(() => {
      // Keep the spin visible briefly even on a cache hit.
      setTimeout(() => setSpinning(false), 600);
    });
  };

  const isLive = source === 'live';
  const isLoading = source === 'loading';

  const label = isLoading ? 'Connecting' : isLive ? 'Live' : 'Snapshot';
  const detail = isLoading
    ? null
    : isLive
      ? `${provider ?? 'API'} · ${formatUpdated(updatedAt)}`
      : `as of ${formatDate(updatedAt)}`;

  return (
    <div
      className={cn(
        'glass-chip flex items-center gap-2 rounded-full py-1 pl-2.5 pr-1.5 text-[11px] font-600',
        isLive ? 'text-emerald-200' : isLoading ? 'text-offwhite-faint' : 'text-amber-200',
      )}
      title={
        isLive
          ? `Live data from ${provider}. Polls automatically while a match is in progress.`
          : isLoading
            ? 'Loading the latest fixtures…'
            : 'Bundled snapshot — not a live feed. Add an API-Football key to go live, then refresh.'
      }
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {isLive && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
        )}
        <span
          className={cn(
            'relative inline-flex h-2 w-2 rounded-full',
            isLive ? 'bg-emerald-400' : isLoading ? 'bg-offwhite-faint' : 'bg-amber-400',
          )}
        />
      </span>
      <span className="uppercase tracking-wide">{label}</span>
      {detail && (
        <span className="hidden font-500 normal-case tracking-normal text-offwhite-faint sm:inline">
          {detail}
        </span>
      )}
      <button
        onClick={refresh}
        aria-label="Refresh data"
        title="Refresh data"
        className="interactive ml-0.5 grid h-6 w-6 place-items-center rounded-full text-offwhite-dim hover:text-offwhite"
      >
        <svg
          viewBox="0 0 24 24"
          className={cn('h-3.5 w-3.5', spinning && 'animate-spin')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
      </button>
    </div>
  );
}

function formatUpdated(ms: number | null): string {
  if (!ms) return 'just now';
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ms: number | null): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString([], { day: 'numeric', month: 'short' });
}
