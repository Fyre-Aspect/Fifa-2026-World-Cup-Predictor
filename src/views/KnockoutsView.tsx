import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Flag } from '@/components/ui/Flag';
import { cn } from '@/lib/cn';
import { projectKnockouts, type ProjectedTie } from '@/lib/knockout';
import { STAGE_LABEL } from '@/lib/tournament';
import { formatProbability } from '@/lib/format';
import type { Team } from '@/types/domain';

/**
 * Knockouts tab: the model's projected bracket. The Round of 16 is seeded from
 * the current group standings, then every later round is simulated — the more
 * probable side advances — through to a projected champion. Each tie shows the
 * predicted scoreline and each side's chance of going through.
 */
export function KnockoutsView() {
  const matches = useStore((s) => s.matches);
  const teams = useStore((s) => s.teams);
  const ratings = useStore((s) => s.ratings);
  const weights = useStore((s) => s.weights);
  const predictions = useStore((s) => s.predictions);

  const proj = useMemo(
    () => projectKnockouts(matches, ratings, weights, predictions),
    [matches, ratings, weights, predictions],
  );

  // Only ties backed by a real fixture (both teams already set) are linkable to a
  // detail page; the simulated QF-and-beyond ties stay as on-card projections.
  const linkableIds = useMemo(
    () => new Set(matches.filter((m) => m.homeTeamId && m.awayTeamId).map((m) => m.id)),
    [matches],
  );

  const champion = proj.championId ? teams[proj.championId] : undefined;

  const rounds: Array<{ label: string; ties: ProjectedTie[] }> = [
    { label: STAGE_LABEL.round32, ties: proj.round32 },
    { label: STAGE_LABEL.round16, ties: proj.round16 },
    { label: STAGE_LABEL.quarter, ties: proj.quarter },
    { label: STAGE_LABEL.semi, ties: proj.semi },
    { label: STAGE_LABEL.final, ties: [proj.final, proj.third].filter((t): t is ProjectedTie => !!t) },
  ];

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-6 max-w-2xl"
      >
        <p className="text-xs font-600 uppercase tracking-widest text-gold-300">Knockout forecast</p>
        <h1 className="mt-2 font-display text-4xl font-700 tracking-tight text-offwhite">
          Projected road to the title
        </h1>
        <p className="mt-3 text-offwhite-dim">
          Seeded from the projected group finishers, then simulated round by round.
          These are model projections, not the drawn bracket — they shift as group
          results and weights change.
        </p>
      </motion.header>

      {/* Projected champion */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="surface-raised mb-8 flex items-center gap-4 p-5"
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold-400/15 text-2xl">
          🏆
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-600 uppercase tracking-widest text-gold-300">
            Projected champion
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Flag code={champion?.flagCode} title={champion?.name} className="h-5 w-7" />
            <span className="font-display text-2xl font-700 text-offwhite">
              {champion?.name ?? 'To be projected'}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="space-y-8">
        {rounds.map((round) => (
          <section key={round.label}>
            <h2 className="mb-3 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
              {round.label}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {round.ties.map((tie) => (
                <TieCard key={tie.id} tie={tie} teams={teams} linkable={linkableIds.has(tie.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function TieCard({
  tie,
  teams,
  linkable,
}: {
  tie: ProjectedTie;
  teams: Record<string, Team>;
  linkable: boolean;
}) {
  const home = tie.homeId ? teams[tie.homeId] : undefined;
  const away = tie.awayId ? teams[tie.awayId] : undefined;
  const pred = tie.prediction;

  // Advancement probability = win + half the draw mass (penalty-shootout proxy).
  const homeAdvance = pred ? pred.homeWin + pred.draw / 2 : 0.5;
  const awayAdvance = pred ? pred.awayWin + pred.draw / 2 : 0.5;

  const body = (
    <div className="surface h-full p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-600 uppercase tracking-wide text-offwhite-faint">
          {tie.id}
        </span>
        {tie.scoreline && (
          <span className="display-num text-sm font-700 text-gold-300">
            {tie.scoreline.home}–{tie.scoreline.away}
            {tie.aet && <span className="ml-1 text-[9px] text-offwhite-faint">AET</span>}
          </span>
        )}
      </div>

      <TeamRow
        team={home}
        fallback={tie.homeId}
        advance={homeAdvance}
        isWinner={tie.winnerId != null && tie.winnerId === tie.homeId}
      />
      <TeamRow
        team={away}
        fallback={tie.awayId}
        advance={awayAdvance}
        isWinner={tie.winnerId != null && tie.winnerId === tie.awayId}
      />
    </div>
  );

  // Seeded ties link to their detail page; pure simulated projections don't.
  return linkable && home && away ? (
    <Link to={`/match/${tie.id}`} className="interactive block">
      {body}
    </Link>
  ) : (
    body
  );
}

function TeamRow({
  team,
  fallback,
  advance,
  isWinner,
}: {
  team: Team | undefined;
  fallback: string | null;
  advance: number;
  isWinner: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Flag code={team?.flagCode} title={team?.name} className="h-3.5 w-5 shrink-0" />
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-sm',
          isWinner ? 'font-700 text-offwhite' : 'text-offwhite-dim',
        )}
      >
        {team?.name ?? fallback ?? 'TBD'}
      </span>
      {isWinner && <span className="text-[10px] text-gold-300">▲</span>}
      <span
        className={cn(
          'display-num w-12 shrink-0 text-right text-xs',
          isWinner ? 'text-gold-300' : 'text-offwhite-faint',
        )}
      >
        {team ? formatProbability(advance) : '—'}
      </span>
    </div>
  );
}
