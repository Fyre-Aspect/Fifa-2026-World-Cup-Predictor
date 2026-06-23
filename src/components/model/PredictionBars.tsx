import { motion } from 'framer-motion';
import type { MatchPrediction } from '@/types/domain';
import { FlipNumber } from './FlipNumber';
import { formatInterval, formatProbability } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Row {
  key: 'home' | 'draw' | 'away';
  label: string;
  value: number;
  color: string;
}

/**
 * The canonical prediction display: three outcome bars with one-decimal
 * percentages that flip on change, plus the confidence band. Probabilities are
 * always shown as model estimates with a band — never as a single hard number.
 */
export function PredictionBars({
  prediction,
  homeLabel,
  awayLabel,
  size = 'md',
}: {
  prediction: MatchPrediction;
  homeLabel: string;
  awayLabel: string;
  size?: 'sm' | 'md';
}) {
  const rows: Row[] = [
    { key: 'home', label: homeLabel, value: prediction.homeWin, color: '#d4a437' },
    { key: 'draw', label: 'Draw', value: prediction.draw, color: '#6fa98e' },
    { key: 'away', label: awayLabel, value: prediction.awayWin, color: '#cfcabb' },
  ];
  const top = rows.reduce((a, b) => (b.value > a.value ? b : a));

  return (
    <div className={cn('space-y-2.5', size === 'sm' && 'space-y-1.5')}>
      {rows.map((row) => (
        <div key={row.key}>
          <div className="mb-1 flex items-center justify-between">
            <span
              className={cn(
                'truncate text-sm',
                row.key === top.key ? 'font-600 text-offwhite' : 'text-offwhite-dim',
              )}
            >
              {row.label}
            </span>
            <FlipNumber
              value={formatProbability(row.value)}
              className={cn(
                'display-num text-sm font-600',
                row.key === top.key ? 'text-gold-300' : 'text-offwhite-dim',
              )}
            />
          </div>
          <div className={cn('overflow-hidden rounded-full bg-pitch-900', size === 'sm' ? 'h-1.5' : 'h-2.5')}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: row.color }}
              animate={{ width: `${Math.max(1, row.value * 100)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            />
          </div>
        </div>
      ))}
      <p className="pt-0.5 text-[11px] text-offwhite-faint">
        Model estimate · confidence band {formatInterval(prediction.interval)} points on each outcome
      </p>
    </div>
  );
}
