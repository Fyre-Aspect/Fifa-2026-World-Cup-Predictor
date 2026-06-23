import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Flag } from '@/components/ui/Flag';
import { cn } from '@/lib/cn';
import { groupStandings, type StandingRow } from '@/lib/standings';
import { ELO_SEED } from '@/model/eloSeed';
import { mostLikelyScore } from '@/model/scoreline';
import { formatKickoff } from '@/lib/tournament';
import type { Match, MatchPrediction, Team } from '@/types/domain';

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
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-6 max-w-2xl"
      >
        <p className="text-xs font-600 uppercase tracking-widest text-gold-300">Group stage</p>
        <h1 className="mt-2 font-display text-4xl font-700 tracking-tight text-offwhite">
          Eight groups, sixteen tickets out
        </h1>
        <p className="mt-3 text-offwhite-dim">
          Live tables and every fixture. Played games show the result; upcoming games
          show the model&rsquo;s predicted scoreline. Top two of each group advance to
          the Round of 16.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
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
  const predicted = prediction ? mostLikelyScore(prediction.xgHome, prediction.xgAway) : null;

  return (
    <Link
      to={`/match/${match.id}`}
      className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-pitch-700/40"
    >
      <span className="min-w-0 flex-1 truncate text-right text-offwhite-dim group-hover:text-offwhite">
        {home?.name ?? 'TBD'}
      </span>
      <span className="shrink-0">
        {match.status === 'scheduled' ? (
          <span className="display-num rounded bg-pitch-900/60 px-1.5 py-0.5 text-[11px] text-offwhite-faint">
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
      <span className="hidden shrink-0 text-[10px] text-offwhite-faint sm:block">
        {match.status === 'live'
          ? `${match.minute ?? ''}'`
          : match.status === 'scheduled'
            ? formatKickoff(match.kickoff)
            : 'FT'}
      </span>
    </Link>
  );
}
