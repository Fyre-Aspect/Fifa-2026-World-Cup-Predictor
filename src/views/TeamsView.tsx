import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Flag } from '@/components/ui/Flag';
import { ELO_SEED } from '@/model/eloSeed';
import { cn } from '@/lib/cn';
import type { Team } from '@/types/domain';

interface RankedTeam {
  team: Team;
  rating: number;
  /** How far the rating has moved since the start of the tournament. */
  delta: number;
}

/**
 * Teams tab: every team ranked by its live power rating, laid out as a ranking
 * that runs down a football pitch — the strongest side stands in the top box,
 * the rest flow down the field. Ratings recompute on every result, so cards
 * re-order in place as the tournament plays out. Tap a team to open its page.
 */
export function TeamsView() {
  const teams = useStore((s) => s.teams);
  const ratings = useStore((s) => s.ratings);

  const ranked = useMemo<RankedTeam[]>(() => {
    return Object.values(teams)
      .map((team) => {
        const seed = ELO_SEED[team.id] ?? 1500;
        const rating = ratings[team.id] ?? seed;
        return { team, rating, delta: rating - seed };
      })
      .sort((a, b) => b.rating - a.rating);
  }, [teams, ratings]);

  const top = ranked[0]?.rating ?? 2000;
  const bottom = ranked[ranked.length - 1]?.rating ?? 1400;
  const span = Math.max(top - bottom, 1);
  const strengthOf = (rating: number) => (rating - bottom) / span;

  const leader = ranked[0];
  const rest = ranked.slice(1);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-6"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-700 tracking-tight text-offwhite sm:text-4xl">
              Teams
            </h1>
            <LivePill />
          </div>
          <div className="mt-3 h-0.5 w-24 rule-fifa" />
          <p className="mt-3 max-w-2xl text-sm text-offwhite-dim">
            All {ranked.length} teams, strongest first. The rating is the model&rsquo;s
            measure of each team&rsquo;s strength — it goes up or down as they win and
            lose, so the order shifts as games are played. Tap any team to see more.
          </p>
        </motion.header>

        {leader && (
          <LeaderCard
            team={leader.team}
            rating={leader.rating}
            delta={leader.delta}
            strength={strengthOf(leader.rating)}
          />
        )}

      <motion.div layout className="mt-4 space-y-2.5">
        {rest.map((r, i) => (
          <TeamCard
            key={r.team.id}
            rank={i + 2}
            team={r.team}
            rating={r.rating}
            delta={r.delta}
            strength={strengthOf(r.rating)}
          />
        ))}
      </motion.div>
    </div>
  );
}

/** Pulsing dot that signals the ratings are live and recompute on every result. */
function LivePill() {
  return (
    <span className="glass-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-600 text-cyan-200">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
      </span>
      Live ratings
    </span>
  );
}

/** The strongest side — a wide hero card sitting in the top box of the pitch. */
function LeaderCard({
  team,
  rating,
  delta,
  strength,
}: {
  team: Team;
  rating: number;
  delta: number;
  strength: number;
}) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Link
        to={`/team/${team.id}`}
        className="surface-raised interactive group relative block overflow-hidden rounded-2xl p-5 sm:p-6"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-80 -translate-x-1/2"
          style={{ backgroundImage: 'radial-gradient(closest-side, rgba(240,180,41,0.28), transparent)' }}
        />
        <div className="relative flex items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <Flag
              code={team.flagCode}
              title={team.name}
              className="h-14 w-20 rounded-md sm:h-16 sm:w-24"
            />
            <span className="display-num absolute -left-2.5 -top-2.5 grid h-7 w-7 place-items-center rounded-full bg-fifa-spectrum text-xs font-700 text-pitch-950 shadow-glow-sm">
              1
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-700 uppercase tracking-widest text-gold-300">Top rated</p>
            <p className="truncate font-display text-2xl font-700 text-offwhite sm:text-3xl">
              {team.name}
            </p>
            <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-pitch-950/60">
              <motion.div
                className="h-full rounded-full bg-fifa-spectrum"
                initial={false}
                animate={{ width: `${Math.max(10, strength * 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <RatingValue rating={rating} className="text-3xl sm:text-4xl" />
            <Meta team={team} delta={delta} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function TeamCard({
  rank,
  team,
  rating,
  delta,
  strength,
}: {
  rank: number;
  team: Team;
  rating: number;
  delta: number;
  strength: number;
}) {
  const podium = rank <= 3;
  return (
    <motion.div layout transition={{ type: 'spring', stiffness: 480, damping: 42 }}>
      <Link
        to={`/team/${team.id}`}
        className="surface interactive flex items-center gap-3 rounded-xl p-3 hover:bg-white/[0.06]"
      >
        <span
          className={cn(
            'display-num grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-700',
            podium ? 'bg-gold-400/20 text-gold-200' : 'text-offwhite-faint',
          )}
        >
          {rank}
        </span>
        <Flag code={team.flagCode} title={team.name} className="h-6 w-9 shrink-0 rounded-[3px]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-600 text-offwhite">{team.name}</p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-pitch-950/60">
            <motion.div
              className="h-full rounded-full bg-fifa-spectrum"
              initial={false}
              animate={{ width: `${Math.max(8, strength * 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <RatingValue rating={rating} className="text-base" />
          <Meta team={team} delta={delta} />
        </div>
      </Link>
    </motion.div>
  );
}

/** Rating number that flashes briefly whenever its value changes. */
function RatingValue({ rating, className }: { rating: number; className?: string }) {
  const value = Math.round(rating);
  return (
    <motion.p
      key={value}
      initial={{ opacity: 0.45 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn('display-num font-700 leading-none text-offwhite', className)}
    >
      {value}
    </motion.p>
  );
}

/** Group / confederation, plus the signed rating change since the start. */
function Meta({ team, delta }: { team: Team; delta: number }) {
  const moved = Math.round(delta);
  return (
    <p className="mt-1 text-[10px] text-offwhite-faint">
      {team.group ? `Group ${team.group}` : team.confederation}
      {moved !== 0 && (
        <span className={cn('ml-1 font-600', moved > 0 ? 'text-emerald-300' : 'text-red-300')}>
          {moved > 0 ? `+${moved}` : `−${Math.abs(moved)}`}
        </span>
      )}
    </p>
  );
}
