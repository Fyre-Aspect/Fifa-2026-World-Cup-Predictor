import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Bracket2D } from '@/components/bracket/Bracket2D';
import { useStore } from '@/store/useStore';

// Code-split the 3D scene so mobile (2D fallback) never downloads three.js.
const BracketScene = lazy(() =>
  import('@/three/BracketScene').then((m) => ({ default: m.BracketScene })),
);

/**
 * Bracket view. On desktop it's a 3D tournament tree suspended in space; below
 * 768px it degrades to a 2D grouped list. Either way, tapping a match opens its
 * prediction.
 */
export function BracketView() {
  const lowPower = useStore((s) => s.lowPower);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-6 max-w-2xl"
      >
        <p className="text-xs font-600 uppercase tracking-widest text-gold-300">Tournament tree</p>
        <h1 className="mt-2 font-display text-4xl font-700 tracking-tight text-offwhite">
          The road to the final
        </h1>
        <p className="mt-3 text-offwhite-dim">
          The knockout tree, Round of 16 rising to the final at the top.
          {lowPower ? ' Tap a match to open its prediction.' : ' Drag to orbit · click a card to flip it to the prediction.'}
          {' '}For the group tables see the Groups tab; for round-by-round forecasts, Knockouts.
        </p>
      </motion.header>

      {lowPower ? (
        <Bracket2D />
      ) : (
        <div className="relative h-[72vh] min-h-[420px] overflow-hidden rounded-2xl border border-pitch-700/40 bg-[radial-gradient(circle_at_50%_30%,#0a2e1f_0%,#04150f_75%)]">
          <Suspense fallback={<BracketLoading />}>
            <BracketScene />
          </Suspense>
        </div>
      )}
    </div>
  );
}

function BracketLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 w-36 animate-pulse-glow rounded-xl bg-pitch-700/50"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
