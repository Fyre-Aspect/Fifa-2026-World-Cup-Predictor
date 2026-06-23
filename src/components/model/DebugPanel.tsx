import { AnimatePresence, motion } from 'framer-motion';
import { useStore, DEFAULT_WEIGHTS } from '@/store/useStore';
import type { ModelWeights } from '@/types/domain';
import { formatWeight } from '@/lib/format';

const ROWS: Array<{ key: keyof ModelWeights; label: string }> = [
  { key: 'elo', label: 'Team strength (Elo)' },
  { key: 'form', label: 'Recent form' },
  { key: 'squad', label: 'Squad quality (players)' },
  { key: 'polymarket', label: 'Polymarket' },
  { key: 'books', label: 'Bookmakers' },
];

/**
 * Power-user panel to retune the four input weights by hand. Changing a weight
 * proportionally rebalances the others so they always sum to 1, and the model
 * re-runs live (useModel reacts to the weight change).
 */
export function DebugPanel() {
  const open = useStore((s) => s.debugOpen);
  const toggle = useStore((s) => s.toggleDebug);
  const weights = useStore((s) => s.baseWeights);
  const setWeights = useStore((s) => s.setBaseWeights);

  const update = (key: keyof ModelWeights, next: number) => {
    const clamped = Math.max(0, Math.min(0.95, next));
    const remaining = 1 - clamped;
    const others = ROWS.map((r) => r.key).filter((k) => k !== key);
    const othersSum = others.reduce((s, k) => s + weights[k], 0);
    const updated = { ...weights, [key]: clamped } as ModelWeights;
    for (const k of others) {
      updated[k] = othersSum > 0 ? (weights[k] / othersSum) * remaining : remaining / others.length;
    }
    setWeights(updated);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="surface-raised fixed bottom-4 right-4 z-40 w-[min(22rem,calc(100%-2rem))] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-600 uppercase tracking-wider text-gold-300">
              Starting weights
            </h3>
            <button
              onClick={toggle}
              className="rounded-md border border-pitch-600/50 px-2 py-0.5 text-xs text-offwhite-dim hover:text-offwhite"
              aria-label="Close debug panel"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {ROWS.map((row) => (
              <div key={row.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-offwhite">{row.label}</span>
                  <span className="display-num text-gold-300">{formatWeight(weights[row.key])}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.95}
                  step={0.01}
                  value={weights[row.key]}
                  onChange={(e) => update(row.key, Number(e.target.value))}
                  className="w-full accent-gold-400"
                  aria-label={row.label}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}
              className="interactive rounded-md border border-pitch-600/50 px-3 py-1.5 text-xs font-500 text-offwhite-dim hover:text-offwhite"
            >
              Reset to defaults
            </button>
            <p className="text-[11px] text-offwhite-faint">
              Learning nudges these as results land
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
