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
 * Teams tab: every team ranked by its current power rating. Tap a team to open
 * its own page with its full rating history and matches.
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

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-6"
      >
        <h1 className="font-display text-3xl font-700 tracking-tight text-offwhite sm:text-4xl">
          Teams
        </h1>
        <div className="mt-3 h-0.5 w-24 rule-fifa" />
        <p className="mt-3 max-w-2xl text-sm text-offwhite-dim">
          All {ranked.length} teams, strongest first. The rating is the model&rsquo;s
          measure of each team&rsquo;s strength — it goes up or down as they win and
          lose. Tap any team to see more.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((r, i) => (
          <TeamCard
            key={r.team.id}
            rank={i + 1}
            team={r.team}
            rating={r.rating}
            delta={r.delta}
            strength={(r.rating - bottom) / span}
          />
        ))}
      </div>
    </div>
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
  return (
    <Link
      to={`/team/${team.id}`}
      className="surface interactive flex items-center gap-3 rounded-xl p-3 hover:bg-pitch-700/40"
    >
      <span className="display-num w-6 shrink-0 text-center text-sm font-700 text-offwhite-faint">
        {rank}
      </span>
      <Flag code={team.flagCode} title={team.name} className="h-6 w-9 shrink-0 rounded-[3px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-600 text-offwhite">{team.name}</p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-pitch-900/70">
          <div
            className="h-full rounded-full bg-fifa-spectrum"
            style={{ width: `${Math.max(8, strength * 100)}%` }}
          />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="display-num text-base font-700 text-offwhite">{Math.round(rating)}</p>
        <p className="text-[10px] text-offwhite-faint">
          {team.group ? `Group ${team.group}` : team.confederation}
          {delta !== 0 && (
            <span className={cn('ml-1 font-600', delta > 0 ? 'text-emerald-300' : 'text-red-300')}>
              {delta > 0 ? '▲' : '▼'}
              {Math.abs(Math.round(delta))}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
