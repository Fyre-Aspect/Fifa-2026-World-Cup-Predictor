import { lazy, Suspense, useMemo, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Flag } from '@/components/ui/Flag';
import { MatchRow } from '@/components/match/MatchRow';
import { EloTrajectoryChart } from '@/components/model/EloTrajectoryChart';
import { buildFormTable } from '@/model/form';
import { teamRatingTrajectory } from '@/model/predict';
import { cn } from '@/lib/cn';
import type { ResultChar } from '@/model/form';

const TeamJerseyScene = lazy(() =>
  import('@/three/TeamJerseyScene').then((m) => ({ default: m.TeamJerseyScene })),
);

export function TeamView() {
  const { teamId } = useParams();
  const teams = useStore((s) => s.teams);
  const matches = useStore((s) => s.matches);
  const ratings = useStore((s) => s.ratings);
  const lowPower = useStore((s) => s.lowPower);

  const team = teamId ? teams[teamId] : undefined;

  const { trajectory, form, teamMatches } = useMemo(() => {
    if (!teamId) return { trajectory: [], form: undefined, teamMatches: [] };
    return {
      trajectory: teamRatingTrajectory(matches, teamId),
      form: buildFormTable(matches)[teamId],
      teamMatches: matches
        .filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
        .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff)),
    };
  }, [teamId, matches]);

  if (!team) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-offwhite-dim">No team loaded for &ldquo;{teamId}&rdquo;.</p>
        <Link to="/bracket" className="mt-4 inline-block text-sm font-500 text-gold-300">
          ← Back to bracket
        </Link>
      </div>
    );
  }

  const elo = ratings[team.id] ? Math.round(ratings[team.id]) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/bracket" className="text-sm font-500 text-gold-300 hover:text-gold-200">
        ← Bracket
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        {/* Jersey */}
        <div className="relative h-72 overflow-hidden rounded-2xl border border-pitch-700/40 bg-[radial-gradient(circle_at_50%_30%,#0a2e1f,#04150f)]">
          {lowPower ? (
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(160deg, ${team.colors.primary}, ${team.colors.secondary})`,
              }}
            />
          ) : (
            <Suspense fallback={<div className="h-full w-full skeleton" />}>
              <TeamJerseyScene team={team} />
            </Suspense>
          )}
        </div>

        {/* Identity + stats */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <Flag code={team.flagCode} title={team.name} className="h-8 w-12" />
            <div>
              <h1 className="font-display text-4xl font-700 tracking-tight text-offwhite">
                {team.name}
              </h1>
              <p className="text-sm text-offwhite-dim">
                {team.confederation}
                {team.group ? ` · Group ${team.group}` : ''}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Current Elo" value={elo != null ? String(elo) : '—'} />
            <Stat
              label="Recent form"
              value={form ? `${form.games} games` : 'No data'}
              children={form ? <FormChips recent={form.recent} /> : undefined}
            />
            <Stat
              label="Matches here"
              value={String(teamMatches.length)}
            />
          </div>

          <div className="surface mt-4 p-4">
            <h2 className="mb-2 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
              Elo trajectory
            </h2>
            <EloTrajectoryChart points={trajectory} />
          </div>
        </div>
      </motion.div>

      {/* Matches */}
      <section className="surface mt-4 p-5">
        <h2 className="mb-3 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
          {team.name}&rsquo;s tournament
        </h2>
        {teamMatches.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {teamMatches.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-offwhite-dim">No fixtures loaded for this team yet.</p>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div className="surface p-3">
      <div className="display-num text-xl font-700 text-offwhite">{value}</div>
      <div className="mt-0.5 text-[11px] text-offwhite-faint">{label}</div>
      {children}
    </div>
  );
}

function FormChips({ recent }: { recent: ResultChar[] }) {
  return (
    <div className="mt-1.5 flex gap-1">
      {recent.slice(0, 5).map((r, i) => (
        <span
          key={i}
          className={cn(
            'grid h-4 w-4 place-items-center rounded-sm text-[9px] font-700',
            r === 'W' ? 'bg-pitch-500 text-offwhite' : r === 'D' ? 'bg-pitch-700 text-offwhite-dim' : 'bg-red-500/30 text-red-200',
          )}
          title={r}
        >
          {r}
        </span>
      ))}
    </div>
  );
}
