import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Flag } from '@/components/ui/Flag';
import { cn } from '@/lib/cn';
import { groupStandings, type StandingRow } from '@/lib/standings';
import { ELO_SEED } from '@/model/eloSeed';
import { predictedScoreline } from '@/model/scoreline';
import { formatKickoff } from '@/lib/tournament';
import { StatusDot } from '@/components/match/MatchStatusBadge';
import { LiveNowBanner } from '@/components/match/LiveNowBanner';
import { RESULTS_AS_OF } from '@/data/realResults';
import type { Match, MatchPrediction, Team } from '@/types/domain';

const snapshotDate = new Date(RESULTS_AS_OF).toLocaleDateString(undefined, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Group Stage tab: a clean card per group with a live standings table and the
 * group's fixtures — played results, the game in progress, and upcoming matches
 * with a predicted scoreline. The top two of each group (the qualifiers) are
 * highlighted.
 */
export function GroupStageView() {
  const matches = useStore((s) => s.matches);
  const teams = useStore((s) => s.teams);
  const predictions = useStore((s) => s.predictions);
  const dataSource = useStore((s) => s.dataSource);

  const groups = useMemo(() => {
    const groupMatches = matches.filter((m) => m.stage === 'group' && m.group);
    const letters = [...new Set(groupMatches.map((m) => m.group as string))].sort();
    return letters.map((letter) => {
      const teamIds = Object.values(teams)
        .filter((t) => t.group === letter)
        .map((t) => t.id)
        .sort((a, b) => (ELO_SEED[b] ?? 1500) - (ELO_SEED[a] ?? 1500));
      const fixtures = groupMatches
        .filter((m) => m.group === letter)
        .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));
      const table = groupStandings(fixtures, teamIds);
      return { letter, table, fixtures };
    });
  }, [matches, teams]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-6 max-w-2xl"
      >
        <h1 className="font-display text-3xl font-700 tracking-tight text-offwhite sm:text-4xl">
          Group stage
        </h1>
        <div className="mt-3 h-0.5 w-24 rule-fifa" />
        <p className="mt-3 text-offwhite-dim">
          Standings and fixtures for all 12 groups. Finished games show the real score;
          games still to come show a predicted score. The top two from each group go
          through to the knockouts.
        </p>
        <p className="mt-2 text-xs text-offwhite-faint">
          {dataSource === 'live'
            ? `Live scores, updating as games are played.`
            : `Saved scores from ${snapshotDate} — not live right now.`}
        </p>
      </motion.header>

      <LiveNowBanner />

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-offwhite-faint">
        <span className="font-600 uppercase tracking-wide">Key</span>
        <Legend status="live" label="Being played now" />
        <Legend status="finished" label="Played · final score" />
        <Legend status="scheduled" label="Upcoming · predicted score" />
      </div>

      <div className="space-y-5">
        {groups.map((g, i) => (
          <GroupCard
            key={g.letter}
            index={i}
            letter={g.letter}
            table={g.table}
            fixtures={g.fixtures}
            teams={teams}
            predictions={predictions}
          />
        ))}
      </div>
    </div>
  );
}

function GroupCard({
  index,
  letter,
  table,
  fixtures,
  teams,
  predictions,
}: {
  index: number;
  letter: string;
  table: StandingRow[];
  fixtures: Match[];
  teams: Record<string, Team>;
  predictions: Record<string, MatchPrediction>;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
      className="surface overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-pitch-700/40 bg-pitch-900/40 px-4 py-3">
        <h2 className="font-display text-lg font-700 text-offwhite">Group {letter}</h2>
        <span className="text-[10px] font-600 uppercase tracking-wide text-offwhite-faint">
          Top 2 advance
        </span>
      </div>

      {/* Standings table */}
      <div className="px-2 pt-2">
        <div className="grid grid-cols-[1.25rem_1fr_repeat(5,1.6rem)] items-center gap-x-1 px-2 py-1 text-[10px] font-600 uppercase tracking-wide text-offwhite-faint">
          <span />
          <span>Team</span>
          <span className="text-center">P</span>
          <span className="text-center">W</span>
          <span className="text-center">D</span>
          <span className="text-center">GD</span>
          <span className="text-center text-gold-300">Pts</span>
        </div>
        {table.map((row, i) => {
          const team = teams[row.teamId];
          const qualifying = i < 2;
          return (
            <Link
              key={row.teamId}
              to={team ? `/team/${row.teamId}` : '#'}
              className={cn(
                'grid grid-cols-[1.25rem_1fr_repeat(5,1.6rem)] items-center gap-x-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-pitch-700/40',
                qualifying ? 'text-offwhite' : 'text-offwhite-dim',
              )}
            >
              <span
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-sm text-[10px] font-700',
                  qualifying ? 'bg-gold-400/20 text-gold-300' : 'text-offwhite-faint',
                )}
              >
                {i + 1}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <Flag code={team?.flagCode} title={team?.name} className="h-3.5 w-5 shrink-0" />
                <span className="truncate">{team?.name ?? row.teamId}</span>
              </span>
              <span className="text-center text-offwhite-dim">{row.played}</span>
              <span className="text-center text-offwhite-dim">{row.won}</span>
              <span className="text-center text-offwhite-dim">{row.drawn}</span>
              <span className="text-center text-offwhite-dim">
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </span>
              <span className="display-num text-center font-700 text-offwhite">{row.points}</span>
            </Link>
          );
        })}
      </div>

      {/* Fixtures */}
      <div className="mt-2 border-t border-pitch-700/30 px-3 py-3">
        <p className="mb-2 text-[10px] font-600 uppercase tracking-wide text-offwhite-faint">
          Fixtures
        </p>
        <div className="space-y-1">
          {fixtures.map((m) => (
            <FixtureRow key={m.id} match={m} teams={teams} prediction={predictions[m.id]} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function Legend({ status, label }: { status: Match['status']; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusDot status={status} />
      {label}
    </span>
  );
}

function FixtureRow({
  match,
  teams,
  prediction,
}: {
  match: Match;
  teams: Record<string, Team>;
  prediction: MatchPrediction | undefined;
}) {
  const home = match.homeTeamId ? teams[match.homeTeamId] : undefined;
  const away = match.awayTeamId ? teams[match.awayTeamId] : undefined;
  const scheduled = match.status === 'scheduled';
  // Predicted scoreline is only shown for upcoming games — never next to a final.
  const predicted = scheduled && prediction ? predictedScoreline(prediction.xgHome, prediction.xgAway) : null;

  return (
    <Link
      to={`/match/${match.id}`}
      className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-pitch-700/40"
    >
      <StatusDot status={match.status} className="mt-0.5" />
      <span className="min-w-0 flex-1 truncate text-right text-offwhite-dim group-hover:text-offwhite">
        {home?.name ?? 'TBD'}
      </span>
      <span className="shrink-0">
        {scheduled ? (
          <span className="display-num inline-flex items-center gap-1 rounded bg-pitch-900/60 px-1.5 py-0.5 text-[11px] text-offwhite-faint">
            <span className="text-[8px] font-700 uppercase tracking-wide text-gold-300/80">P</span>
            {predicted ? `${predicted.home}–${predicted.away}` : 'vs'}
          </span>
        ) : (
          <span
            className={cn(
              'display-num rounded px-1.5 py-0.5 text-[11px] font-700',
              match.status === 'live' ? 'bg-red-500/15 text-red-300' : 'bg-pitch-700/60 text-offwhite',
            )}
          >
            {match.score?.home}–{match.score?.away}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-offwhite-dim group-hover:text-offwhite">
        {away?.name ?? 'TBD'}
      </span>
      <span className="w-[4.75rem] shrink-0 text-right text-[10px] text-offwhite-faint">
        {match.status === 'live' ? (
          <span className="font-700 text-red-300">{match.minute ? `${match.minute}'` : 'LIVE'}</span>
        ) : scheduled ? (
          formatKickoff(match.kickoff)
        ) : (
          'FT'
        )}
      </span>
    </Link>
  );
}
