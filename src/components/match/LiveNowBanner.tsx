import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Flag } from '@/components/ui/Flag';
import { latestCommentaryLine } from '@/lib/commentary';
import { mostLikelyScore } from '@/model/scoreline';
import type { Match, MatchPrediction, Team } from '@/types/domain';

/**
 * A banner that surfaces any matches in progress right now, each with its live
 * score, the model's predicted scoreline, and the latest commentary line —
 * updating as the sample clock ticks. Renders nothing when no match is live.
 */
export function LiveNowBanner() {
  const matches = useStore((s) => s.matches);
  const teams = useStore((s) => s.teams);
  const predictions = useStore((s) => s.predictions);

  const live = matches
    .filter((m) => m.status === 'live')
    .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));

  return (
    <AnimatePresence>
      {live.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-6"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-700 uppercase tracking-wide text-red-300">
              <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-red-400" />
              Live now
            </span>
            <span className="text-xs text-offwhite-faint">
              {live.length} match{live.length === 1 ? '' : 'es'} in progress
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {live.map((m) => (
              <LiveCard key={m.id} match={m} teams={teams} prediction={predictions[m.id]} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LiveCard({
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
  const line = latestCommentaryLine(match, home?.name ?? 'Home', away?.name ?? 'Away');
  const predicted = prediction ? mostLikelyScore(prediction.xgHome, prediction.xgAway) : null;

  return (
    <Link
      to={`/match/${match.id}`}
      className="surface-raised interactive block p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <TeamLine team={home} score={match.score?.home} />
          <TeamLine team={away} score={match.score?.away} />
        </div>
        <div className="shrink-0 text-right">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-700 uppercase tracking-wide text-red-300">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-red-400" />
            {match.minute ? `${match.minute}'` : 'Live'}
          </span>
          {predicted && (
            <p className="mt-1 text-[10px] text-offwhite-faint">
              pred <span className="display-num text-offwhite-dim">{predicted.home}–{predicted.away}</span>
            </p>
          )}
        </div>
      </div>
      {line && (
        <p className="mt-2 truncate border-t border-pitch-700/40 pt-2 text-xs text-offwhite-dim">
          <span className="display-num mr-1.5 text-red-300">{match.minute ?? ''}&rsquo;</span>
          {line}
        </p>
      )}
    </Link>
  );
}

function TeamLine({ team, score }: { team: Team | undefined; score: number | undefined }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <Flag code={team?.flagCode} title={team?.name} className="h-3.5 w-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-sm font-500 text-offwhite">
        {team?.name ?? 'TBD'}
      </span>
      <span className="display-num w-5 text-right text-sm font-700 text-offwhite">
        {score ?? 0}
      </span>
    </div>
  );
}
