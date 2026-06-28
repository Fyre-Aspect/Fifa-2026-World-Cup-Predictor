import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { projectedBracketMatches, projectedR32Matches } from '@/lib/projectedBracket';
import { projectKnockouts, officialBracketSkeleton } from '@/lib/knockout';
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
    // Official view: the real FIFA skeleton with its R32 filled by the actual
    // qualifiers; later rounds stay open until the knockouts are played.
    if (mode === 'official') {
      return officialBracketSkeleton(projectedR32Matches(matches, teams, ratings));
    }
    // Projected view: fill that same skeleton with the qualifiers and simulate
    // every round to a champion.
    const source = projectedBracketMatches(matches, teams, ratings);
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
        className="mb-5 text-pop"
      >
        <h1 className="font-display text-4xl font-800 tracking-tight text-offwhite sm:text-5xl">
          Knockout bracket
        </h1>
        <div className="mt-3 h-0.5 w-24 rule-fifa" />
        <p className="mt-3 max-w-2xl text-sm font-500 text-offwhite">
          {mode === 'projected'
            ? 'A predicted bracket: we take who is on course to qualify from each group and play it out to a winner. It updates as results come in — a prediction, not the real draw.'
            : 'The official FIFA 2026 bracket. The Round of 32 is set — each fixed group-position slot now carries its qualified team; the later rounds fill in as the knockouts are played.'}
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
