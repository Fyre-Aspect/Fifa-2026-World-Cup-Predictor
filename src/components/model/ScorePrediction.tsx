import { motion } from 'framer-motion';
import type { MatchPrediction } from '@/types/domain';
import { predictedScoreline, topScorelines, overProbability } from '@/model/scoreline';
import { formatProbability } from '@/lib/format';

/**
 * The predicted scoreline: each side's expected goals rounded to a concrete
 * result, plus the most likely exact scorelines (with probabilities) and the
 * over-2.5-goals chance. This is the "match score" view — a concrete result to
 * sit alongside the win/draw/win probabilities.
 */
export function ScorePrediction({
  prediction,
  homeLabel,
  awayLabel,
}: {
  prediction: MatchPrediction;
  homeLabel: string;
  awayLabel: string;
}) {
  const { xgHome, xgAway } = prediction;
  const top = predictedScoreline(xgHome, xgAway, prediction.matchId);
  const alts = topScorelines(xgHome, xgAway, 5);
  const over = overProbability(xgHome, xgAway, 2.5);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-offwhite-dim">{homeLabel}</p>
          <p className="truncate text-xs text-offwhite-dim">{awayLabel}</p>
        </div>
        <motion.div
          key={`${top.home}-${top.away}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="display-num text-5xl font-700 leading-none text-gold-300"
        >
          {top.home}<span className="px-1 text-offwhite-faint">–</span>{top.away}
        </motion.div>
      </div>
      <p className="mt-2 text-[11px] text-offwhite-faint">
        A plausible scoreline drawn from each side&rsquo;s expected goals
      </p>

      <div className="mt-4 space-y-1.5">
        <p className="text-[10px] font-600 uppercase tracking-wide text-offwhite-faint">
          Most likely exact scores
        </p>
        <div className="flex flex-wrap gap-1.5">
          {alts.map((s) => (
            <span
              key={`${s.home}-${s.away}`}
              className="rounded-md border border-pitch-600/40 bg-pitch-900/50 px-2 py-1 text-xs"
            >
              <span className="display-num text-offwhite">{s.home}–{s.away}</span>
              <span className="ml-1.5 text-offwhite-faint">{formatProbability(s.prob)}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-pitch-700/30 pt-3 text-xs">
        <span className="text-offwhite-dim">Over 2.5 goals</span>
        <span className="display-num text-offwhite">{formatProbability(over)}</span>
      </div>
    </div>
  );
}
