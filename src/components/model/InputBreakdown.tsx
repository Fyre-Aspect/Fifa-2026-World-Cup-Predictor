import type { ModelWeights } from '@/types/domain';
import type { InputDistributions, Outcome } from '@/model/types';
import { formatProbability, formatWeight } from '@/lib/format';

const ROWS: Array<{ key: keyof InputDistributions; weightKey: keyof ModelWeights; label: string }> = [
  { key: 'elo', weightKey: 'elo', label: 'Elo' },
  { key: 'form', weightKey: 'form', label: 'Form' },
  { key: 'squad', weightKey: 'squad', label: 'Squad' },
  { key: 'polymarket', weightKey: 'polymarket', label: 'Polymarket' },
  { key: 'books', weightKey: 'books', label: 'Books' },
];

/** Shows what each individual input distribution says, before blending. */
export function InputBreakdown({
  breakdown,
  weights,
}: {
  breakdown: InputDistributions;
  weights: ModelWeights;
}) {
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 text-[10px] font-600 uppercase tracking-wide text-offwhite-faint">
        <span>Input</span>
        <span className="w-12 text-right">Home</span>
        <span className="w-12 text-right">Draw</span>
        <span className="w-12 text-right">Away</span>
      </div>
      {ROWS.map((row) => {
        const o: Outcome | null = breakdown[row.key];
        return (
          <div
            key={row.key}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-t border-pitch-700/30 pt-2 text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="text-offwhite">{row.label}</span>
              <span className="rounded bg-pitch-700/50 px-1.5 py-0.5 text-[10px] text-gold-300">
                {formatWeight(weights[row.weightKey])}
              </span>
            </span>
            {o ? (
              <>
                <span className="display-num w-12 text-right text-offwhite-dim">{formatProbability(o.homeWin)}</span>
                <span className="display-num w-12 text-right text-offwhite-dim">{formatProbability(o.draw)}</span>
                <span className="display-num w-12 text-right text-offwhite-dim">{formatProbability(o.awayWin)}</span>
              </>
            ) : (
              <span className="col-span-3 text-right text-xs text-offwhite-faint">no data</span>
            )}
          </div>
        );
      })}
      <p className="pt-1 text-[11px] leading-relaxed text-offwhite-faint">
        Missing inputs (often the markets) are dropped and the remaining weights
        are renormalized — the blend never invents data it doesn&rsquo;t have.
      </p>
    </div>
  );
}
