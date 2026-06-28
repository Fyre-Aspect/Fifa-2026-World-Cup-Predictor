import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Flag } from '@/components/ui/Flag';
import { cn } from '@/lib/cn';
import { formatKickoff } from '@/lib/tournament';
import { mostLikelyScore } from '@/model/scoreline';
import { argmaxOutcome } from '@/model/probability';
import { labelFromScore } from '@/model/scoring';
import { MatchStatusBadge } from '@/components/match/MatchStatusBadge';
import type { Match } from '@/types/domain';

/** Compact, clickable 2D representation of a single match. */
export function MatchRow({ match }: { match: Match }) {
  const teams = useStore((s) => s.teams);
  const prediction = useStore((s) => s.predictions[match.id]);
  const home = match.homeTeamId ? teams[match.homeTeamId] : undefined;
  const away = match.awayTeamId ? teams[match.awayTeamId] : undefined;

  const predicted = prediction
    ? mostLikelyScore(prediction.xgHome, prediction.xgAway)
    : null;
  const predRight =
    match.status === 'finished' && match.score && prediction
      ? argmaxOutcome(prediction) === labelFromScore(match.score)
      : null;

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
          winner={match.score != null && match.score.home > match.score.away}
        />
        <TeamLine
          name={away?.name ?? 'TBD'}
          flag={away?.flagCode}
          score={match.score?.away}
          finished={match.status === 'finished'}
          winner={match.score != null && match.score.away > match.score.home}
        />
      </div>
      <div className="shrink-0 text-right">
        <MatchStatusBadge status={match.status} minute={match.minute} />
        <div className="mt-1 text-[11px] text-offwhite-faint">
          {match.status === 'scheduled' ? formatKickoff(match.kickoff) : null}
          {predicted && (
            <span
              className={cn(
                'display-num',
                predRight === true && 'text-emerald-300',
                predRight === false && 'text-red-300/80',
              )}
              title={`Model predicted ${predicted.home}–${predicted.away}`}
            >
              {match.status === 'scheduled' ? ' · ' : ''}
              Predicted {predicted.home}–{predicted.away}
              {predRight === true ? ' ✓' : predRight === false ? ' ✗' : ''}
            </span>
          )}
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

