import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { projectKnockouts } from '@/lib/knockout';
import { projectedBracketMatches } from '@/lib/projectedBracket';
import { KnockoutBracket } from '@/components/bracket/KnockoutBracket';
import { cn } from '@/lib/cn';

type Mode = 'projected' | 'official';

/**
 * Knockout bracket — a flat, scannable tournament tree (no 3D). Two modes:
 *  • Projected — seeds the bracket from the model's projected group qualifiers
 *    and simulates every round to a projected champion.
 *  • Official — the real bracket shape; slots read TBD until the draw fills them.
 */
export function BracketView() {
  const matches = useStore((s) => s.matches);
  const teams = useStore((s) => s.teams);
  const ratings = useStore((s) => s.ratings);
  const weights = useStore((s) => s.weights);
  const predictions = useStore((s) => s.predictions);

  const [mode, setMode] = useState<Mode>('projected');

  const proj = useMemo(() => {
    const source =
      mode === 'projected' ? projectedBracketMatches(matches, teams, ratings) : matches;
    return projectKnockouts(source, ratings, weights, predictions);
  }, [mode, matches, teams, ratings, weights, predictions]);

  // Only ties backed by a real fixture (both teams set) link to a detail page.
  const linkableIds = useMemo(
    () => new Set(matches.filter((m) => m.homeTeamId && m.awayTeamId).map((m) => m.id)),
    [matches],
  );

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-5"
      >
        <h1 className="font-display text-3xl font-700 tracking-tight text-offwhite sm:text-4xl">
          Knockout bracket
        </h1>
        <div className="mt-3 h-0.5 w-24 rule-fifa" />
        <p className="mt-3 max-w-2xl text-sm text-offwhite-dim">
          {mode === 'projected'
            ? 'A predicted bracket: we take who is on course to qualify from each group and play it out to a winner. It updates as results come in — a prediction, not the real draw.'
            : 'The real bracket. Slots stay empty until results and the draw decide who fills them.'}
        </p>
      </motion.header>

      <div className="mb-6 inline-flex rounded-full border border-white/10 bg-pitch-900/50 p-1 text-sm">
        <ModeButton active={mode === 'projected'} onClick={() => setMode('projected')}>
          Projected
        </ModeButton>
        <ModeButton active={mode === 'official'} onClick={() => setMode('official')}>
          Official
        </ModeButton>
      </div>

      <KnockoutBracket proj={proj} teams={teams} mode={mode} linkableIds={linkableIds} />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'interactive rounded-full px-4 py-1.5 font-600 transition-colors',
        active ? 'bg-gold-400 text-pitch-950' : 'text-offwhite-dim hover:text-offwhite',
      )}
    >
      {children}
    </button>
  );
}
