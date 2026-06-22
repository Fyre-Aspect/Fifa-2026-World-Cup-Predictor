import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Countdown } from '@/components/ui/Countdown';
import { CitySchedulePanel } from '@/components/globe/CitySchedulePanel';
import { TopContenders } from '@/components/globe/TopContenders';
import { GlobeFallback2D } from '@/components/globe/GlobeFallback2D';
import { useStore } from '@/store/useStore';
import { TOURNAMENT } from '@/data/tournament';

// Code-split the 3D scene so mobile (2D fallback) never downloads three.js.
const GlobeScene = lazy(() =>
  import('@/three/GlobeScene').then((m) => ({ default: m.GlobeScene })),
);

/**
 * Landing view. The central surface is a rotating 3D globe of host cities;
 * below 768px it degrades to a 2D map of selectable city chips, since r3f on
 * phones tanks performance.
 */
export function GlobeView() {
  const lowPower = useStore((s) => s.lowPower);

  return (
    <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-stretch gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10 lg:py-10">
      {/* Copy + countdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="z-10 flex max-w-xl flex-col justify-center"
      >
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-pitch-600/50 bg-pitch-800/60 px-3 py-1 text-xs font-500 uppercase tracking-widest text-gold-300">
          {TOURNAMENT.hosts.join(' · ')}
        </span>
        <h1 className="mt-5 font-display text-5xl font-700 leading-[0.95] tracking-tight text-offwhite sm:text-6xl">
          The World Cup,
          <br />
          <span className="text-gradient-gold">forecast honestly.</span>
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-offwhite-dim">
          Spin the globe, tap a host city, and follow every match of {TOURNAMENT.name}.
          GroupStage blends team strength, form, and live market wisdom into a
          probability for each game — then keeps public score of how right it was.
        </p>

        <div className="mt-8">
          <Countdown />
        </div>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            to="/bracket"
            className="interactive rounded-lg bg-gold-400 px-5 py-3 text-sm font-600 text-pitch-950 shadow-glow hover:bg-gold-300"
          >
            Explore the bracket
          </Link>
          <Link
            to="/model"
            className="interactive rounded-lg border border-pitch-600/60 bg-pitch-800/60 px-5 py-3 text-sm font-600 text-offwhite hover:border-gold-400/40"
          >
            How the model works
          </Link>
        </div>

        <div className="mt-8">
          <TopContenders />
        </div>
      </motion.div>

      {/* Globe surface */}
      <div className="relative h-[58vh] min-h-[360px] overflow-hidden rounded-2xl border border-pitch-700/40 bg-[radial-gradient(circle_at_50%_40%,#0a2e1f_0%,#04150f_70%)] lg:h-auto lg:min-h-[78vh]">
        {lowPower ? (
          <GlobeFallback2D />
        ) : (
          <Suspense fallback={<GlobeLoading />}>
            <GlobeScene />
          </Suspense>
        )}
        <CitySchedulePanel />
        <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-center text-[11px] text-offwhite-faint">
          {lowPower ? 'Tap a city to see its matches' : 'Drag to orbit · tap a pin to fly in'}
        </p>
      </div>
    </div>
  );
}

function GlobeLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="h-40 w-40 animate-pulse-glow rounded-full bg-[radial-gradient(circle_at_35%_30%,#1a4733,#04150f)]" />
    </div>
  );
}
