import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Flag } from '@/components/ui/Flag';
import { cn } from '@/lib/cn';
import { formatKickoff } from '@/lib/tournament';
import type { Match } from '@/types/domain';

/** Compact, clickable 2D representation of a single match. */
export function MatchRow({ match }: { match: Match }) {
  const teams = useStore((s) => s.teams);
  const home = match.homeTeamId ? teams[match.homeTeamId] : undefined;
  const away = match.awayTeamId ? teams[match.awayTeamId] : undefined;

  return (
    <Link
      to={`/match/${match.id}`}
      className="interactive group flex items-center gap-3 rounded-lg border border-pitch-600/30 bg-pitch-800/50 px-3 py-2.5 hover:border-gold-400/40"
    >
      <div className="flex-1">
        <TeamLine
          name={home?.name ?? 'TBD'}
          flag={home?.flagCode}
          score={match.score?.home}
          finished={match.status === 'finished'}
          winner={
            match.score != null && match.score.home > match.score.away
          }
        />
        <TeamLine
          name={away?.name ?? 'TBD'}
          flag={away?.flagCode}
          score={match.score?.away}
          finished={match.status === 'finished'}
          winner={
            match.score != null && match.score.away > match.score.home
          }
        />
      </div>
      <div className="shrink-0 text-right">
        <StatusBadge match={match} />
        <div className="mt-1 text-[11px] text-offwhite-faint">
          {formatKickoff(match.kickoff)}
        </div>
      </div>
    </Link>
  );
}

function TeamLine({
  name,
  flag,
  score,
  finished,
  winner,
}: {
  name: string;
  flag: string | undefined;
  score: number | undefined;
  finished: boolean;
  winner: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <Flag code={flag} title={name} className="h-3.5 w-5" />
      <span
        className={cn(
          'flex-1 truncate text-sm',
          finished && !winner ? 'text-offwhite-dim' : 'text-offwhite',
          winner && 'font-600',
        )}
      >
        {name}
      </span>
      {score != null && (
        <span className="display-num w-5 text-right text-sm font-700 text-offwhite">
          {score}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ match }: { match: Match }) {
  if (match.status === 'live') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-600 uppercase tracking-wide text-red-300">
        <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-red-400" />
        {match.minute ? `${match.minute}'` : 'Live'}
      </span>
    );
  }
  if (match.status === 'finished') {
    return (
      <span className="rounded-full bg-pitch-600/40 px-2 py-0.5 text-[10px] font-600 uppercase tracking-wide text-offwhite-dim">
        Full time
      </span>
    );
  }
  return (
    <span className="rounded-full bg-gold-400/10 px-2 py-0.5 text-[10px] font-600 uppercase tracking-wide text-gold-300">
      Upcoming
    </span>
  );
}
