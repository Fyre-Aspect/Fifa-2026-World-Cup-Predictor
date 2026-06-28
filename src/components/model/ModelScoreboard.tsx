import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { argmaxOutcome } from '@/model/probability';
import { labelFromScore } from '@/model/scoring';

/**
 * A plain-English scoreboard for the model itself: how many finished games it
 * called, how many it got right, and a reminder that it retrains on every
 * result. Makes the "predict, then learn from the outcome" loop visible on the
 * home page instead of hiding it on the model page.
 */
export function ModelScoreboard() {
  const matches = useStore((s) => s.matches);
  const predictions = useStore((s) => s.predictions);

  const { total, correct, pct } = useMemo(() => {
    let total = 0;
    let correct = 0;
    for (const m of matches) {
      if (m.status !== 'finished' || !m.score) continue;
      const p = predictions[m.id];
      if (!p) continue;
      total += 1;
      if (argmaxOutcome(p) === labelFromScore(m.score)) correct += 1;
    }
    return { total, correct, pct: total ? Math.round((correct / total) * 100) : 0 };
  }, [matches, predictions]);

  if (total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="surface-raised mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-fifa-spectrum text-pitch-950">
          <span className="display-num text-xl font-700">{pct}%</span>
        </div>
        <div>
          <p className="text-sm font-700 text-offwhite">
            The model called {correct} of {total} finished games right
          </p>
          <p className="mt-0.5 text-xs text-offwhite-dim">
            It predicts every game, then learns from the real result to get sharper —
            so its guesses compound over the tournament.
          </p>
        </div>
      </div>
      <Link
        to="/model"
        className="glass-chip interactive shrink-0 rounded-lg px-4 py-2 text-center text-xs font-600 text-gold-300 hover:text-gold-200"
      >
        See how it learns →
      </Link>
    </motion.div>
  );
}
