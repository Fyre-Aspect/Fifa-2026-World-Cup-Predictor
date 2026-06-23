import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { matchCommentary, type CommentaryType } from '@/lib/commentary';
import { cn } from '@/lib/cn';
import type { Match } from '@/types/domain';

/**
 * The live (or full-time) commentary feed for a match — "what is being said".
 * It re-derives from the match each render, so as the sample clock advances the
 * minute, new lines appear at the top automatically. Goals are highlighted.
 */
export function LiveCommentary({
  match,
  homeName,
  awayName,
}: {
  match: Match;
  homeName: string;
  awayName: string;
}) {
  const events = useMemo(
    () => matchCommentary(match, homeName, awayName),
    [match, homeName, awayName],
  );

  if (events.length === 0) return null;
  const feed = [...events].reverse(); // newest first
  const live = match.status === 'live';

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-600 uppercase tracking-wider text-offwhite-dim">
          {live ? 'Live updates' : 'Match timeline'}
        </h2>
        {live && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-700 uppercase tracking-wide text-red-300">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-red-400" />
            {match.minute ? `${match.minute}'` : 'Live'}
          </span>
        )}
      </div>

      <ol className="relative space-y-2.5 border-l border-pitch-700/50 pl-4">
        <AnimatePresence initial={false}>
          {feed.map((e) => (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="relative"
            >
              <span
                className={cn(
                  'absolute -left-[1.32rem] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-pitch-900',
                  markerColor(e.type),
                )}
              />
              <div className="flex items-start gap-2">
                <span className="display-num mt-px w-8 shrink-0 text-right text-xs font-600 text-offwhite-faint">
                  {e.minute}&rsquo;
                </span>
                <p
                  className={cn(
                    'text-sm leading-snug',
                    e.type === 'goal'
                      ? 'font-600 text-gold-200'
                      : e.type === 'card'
                        ? 'text-red-200/90'
                        : 'text-offwhite-dim',
                  )}
                >
                  {e.type === 'goal' && <span className="mr-1">⚽</span>}
                  {e.text}
                </p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}

function markerColor(type: CommentaryType): string {
  switch (type) {
    case 'goal':
      return 'bg-gold-400';
    case 'card':
      return 'bg-red-400';
    case 'save':
    case 'chance':
      return 'bg-sky-400/80';
    case 'fulltime':
    case 'halftime':
    case 'kickoff':
      return 'bg-emerald-400/70';
    default:
      return 'bg-pitch-500';
  }
}
