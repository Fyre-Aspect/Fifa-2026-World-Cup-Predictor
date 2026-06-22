import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Countdown } from '@/components/ui/Countdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { TOURNAMENT } from '@/data/tournament';

/**
 * Landing view. In the next iteration the central panel becomes a rotating
 * 3D globe with host-city pins; for now it is a styled placeholder so the
 * shell is presentable on its own.
 */
export function GlobeView() {
  return (
    <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1600px] grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
      {/* Copy + countdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="z-10 max-w-xl"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-pitch-600/50 bg-pitch-800/60 px-3 py-1 text-xs font-500 uppercase tracking-widest text-gold-300">
          {TOURNAMENT.hosts.join(' · ')}
        </span>
        <h1 className="mt-5 font-display text-5xl font-700 leading-[0.95] tracking-tight text-offwhite sm:text-6xl">
          The World Cup,
          <br />
          <span className="text-gradient-gold">forecast honestly.</span>
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-offwhite-dim">
          GroupStage blends team strength, recent form, and live market wisdom into a
          probability for every match of {TOURNAMENT.name} — then keeps score of how
          right it was, in the open.
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
      </motion.div>

      {/* Globe placeholder + top-3 panel */}
      <div className="relative flex flex-col items-center gap-8">
        <GlobeMotif />
        <TopContenders />
      </div>
    </div>
  );
}

/** CSS/SVG stand-in for the 3D globe arriving in the next commit. */
function GlobeMotif() {
  return (
    <div className="relative aspect-square w-full max-w-md">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#1a4733_0%,#0a2e1f_45%,#04150f_100%)] shadow-[0_0_80px_-10px_rgba(212,164,55,0.25)]" />
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 90, ease: 'linear', repeat: Infinity }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="globe-edge" cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(212,164,55,0.18)" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="96" fill="url(#globe-edge)" />
        {/* graticule */}
        {[20, 40, 60, 80].map((r) => (
          <circle
            key={r}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="rgba(70,135,106,0.35)"
            strokeWidth="0.5"
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <line
            key={i}
            x1="100"
            y1="4"
            x2="100"
            y2="196"
            stroke="rgba(70,135,106,0.25)"
            strokeWidth="0.5"
            transform={`rotate(${i * 15} 100 100)`}
          />
        ))}
      </motion.svg>
    </div>
  );
}

/** Top-3 predicted winners — placeholder skeletons until the model exists. */
function TopContenders() {
  return (
    <div className="surface w-full max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-600 uppercase tracking-wider text-offwhite-dim">
          Predicted to lift the trophy
        </h2>
        <span className="text-[11px] text-offwhite-faint">model estimate</span>
      </div>
      <ul className="space-y-2">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="display-num w-5 text-center text-lg font-700 text-gold-400">
              {i + 1}
            </span>
            <Skeleton className="h-7 w-7 rounded-sm" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12" />
          </li>
        ))}
      </ul>
    </div>
  );
}
