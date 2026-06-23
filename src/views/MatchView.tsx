import { lazy, Suspense, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Flag } from '@/components/ui/Flag';
import { PredictionBars } from '@/components/model/PredictionBars';
import { ScorePrediction } from '@/components/model/ScorePrediction';
import { SquadPanel } from '@/components/model/SquadPanel';
import { InputBreakdown } from '@/components/model/InputBreakdown';
import { PostMatchAnalysis } from '@/components/model/PostMatchAnalysis';
import { buildFormTable } from '@/model/form';
import { inputBreakdown } from '@/model/predict';
import { STAGE_LABEL, formatKickoff } from '@/lib/tournament';
import { formatXg } from '@/lib/format';
import { DEFAULT_WEIGHTS } from '@/store/useStore';

const JerseyScene = lazy(() =>
  import('@/three/JerseyScene').then((m) => ({ default: m.JerseyScene })),
);

export function MatchView() {
  const { matchId } = useParams();
  const matches = useStore((s) => s.matches);
  const teams = useStore((s) => s.teams);
  const predictions = useStore((s) => s.predictions);
  const ratings = useStore((s) => s.ratings);
  const weights = useStore((s) => s.weights);
  const lowPower = useStore((s) => s.lowPower);

  const match = matches.find((m) => m.id === matchId);
  const home = match?.homeTeamId ? teams[match.homeTeamId] : undefined;
  const away = match?.awayTeamId ? teams[match.awayTeamId] : undefined;
  const prediction = match ? predictions[match.id] : undefined;

  const breakdown = useMemo(() => {
    if (!match) return null;
    const form = buildFormTable(matches);
    return inputBreakdown(match, { ratings, form, weights });
  }, [match, matches, ratings, weights]);

  if (!match) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-offwhite-dim">That match isn&rsquo;t in the schedule.</p>
        <Link to="/bracket" className="mt-4 inline-block text-sm font-500 text-gold-300">
          ← Back to bracket
        </Link>
      </div>
    );
  }

  const homeName = home?.name ?? 'TBD';
  const awayName = away?.name ?? 'TBD';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/bracket" className="text-sm font-500 text-gold-300 hover:text-gold-200">
        ← Bracket
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-3"
      >
        <p className="text-xs font-600 uppercase tracking-widest text-gold-300">
          {STAGE_LABEL[match.stage]}
          {match.group ? ` · Group ${match.group}` : ''}
        </p>

        {/* Scoreline / banner */}
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-pitch-700/40 bg-[radial-gradient(circle_at_50%_20%,#0a2e1f,#04150f)]">
          <div className="relative h-44 sm:h-56">
            {lowPower ? (
              <JerseyFallback2D
                homeColor={home?.colors.primary ?? '#46876a'}
                awayColor={away?.colors.primary ?? '#cfcabb'}
              />
            ) : (
              <Suspense fallback={<div className="h-full w-full skeleton" />}>
                <JerseyScene home={home} away={away} />
              </Suspense>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-pitch-700/40 bg-pitch-950/60 px-5 py-4">
            <TeamSide name={homeName} flag={home?.flagCode} teamId={home?.id} align="left" />
            <ScoreCenter
              status={match.status}
              minute={match.minute}
              homeScore={match.score?.home}
              awayScore={match.score?.away}
              kickoff={match.kickoff}
            />
            <TeamSide name={awayName} flag={away?.flagCode} teamId={away?.id} align="right" />
          </div>
        </div>
      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Prediction */}
        <section className="surface p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-600 uppercase tracking-wider text-offwhite-dim">
              {match.status === 'finished' ? 'Pre-match prediction' : 'Prediction'}
            </h2>
            {prediction && (
              <span className="display-num text-xs text-offwhite-faint">
                xG {formatXg(prediction.xgHome)} – {formatXg(prediction.xgAway)}
              </span>
            )}
          </div>

          {prediction ? (
            <PredictionBars prediction={prediction} homeLabel={homeName} awayLabel={awayName} />
          ) : (
            <p className="text-sm text-offwhite-dim">
              No prediction yet — both teams need to be determined.
            </p>
          )}
        </section>

        {/* Predicted scoreline */}
        <section className="surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
            Predicted score
          </h2>
          {prediction ? (
            <ScorePrediction prediction={prediction} homeLabel={homeName} awayLabel={awayName} />
          ) : (
            <p className="text-sm text-offwhite-dim">Available once both teams are set.</p>
          )}
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Squad strength + key players */}
        <section className="surface p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
            Squad strength &amp; key players
          </h2>
          <SquadPanel home={home} away={away} />
        </section>

        {/* Input breakdown */}
        <section className="surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
            What each input thinks
          </h2>
          {breakdown ? (
            <InputBreakdown breakdown={breakdown} weights={weights} />
          ) : (
            <p className="text-sm text-offwhite-dim">Unavailable for undetermined matches.</p>
          )}
        </section>
      </div>

      {/* Post-match analysis */}
      {match.status === 'finished' && match.score && prediction && (
        <div className="mt-4">
          <PostMatchAnalysis
            prediction={prediction}
            score={match.score}
            homeName={homeName}
            awayName={awayName}
          />
        </div>
      )}

      <p className="mt-6 text-xs text-offwhite-faint">
        Weights this run — Elo {Math.round(weights.elo * 100)}%, form{' '}
        {Math.round(weights.form * 100)}%, squad {Math.round(weights.squad * 100)}%, Polymarket{' '}
        {Math.round(weights.polymarket * 100)}%, books {Math.round(weights.books * 100)}%. Defaults are{' '}
        {Math.round(DEFAULT_WEIGHTS.elo * 100)}/{Math.round(DEFAULT_WEIGHTS.form * 100)}/
        {Math.round(DEFAULT_WEIGHTS.squad * 100)}/{Math.round(DEFAULT_WEIGHTS.polymarket * 100)}/
        {Math.round(DEFAULT_WEIGHTS.books * 100)}.
      </p>
    </div>
  );
}

function TeamSide({
  name,
  flag,
  teamId,
  align,
}: {
  name: string;
  flag: string | undefined;
  teamId: string | undefined;
  align: 'left' | 'right';
}) {
  const inner = (
    <>
      <Flag code={flag} title={name} className="h-7 w-10 shrink-0" />
      <span className="font-display text-lg font-600 leading-tight text-offwhite transition-colors group-hover:text-gold-200 sm:text-2xl">
        {name}
      </span>
    </>
  );
  const classes = `group flex flex-1 items-center gap-3 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`;
  return teamId ? (
    <Link to={`/team/${teamId}`} className={classes}>
      {inner}
    </Link>
  ) : (
    <div className={classes}>{inner}</div>
  );
}

function ScoreCenter({
  status,
  minute,
  homeScore,
  awayScore,
  kickoff,
}: {
  status: string;
  minute: number | null;
  homeScore: number | undefined;
  awayScore: number | undefined;
  kickoff: string;
}) {
  if (homeScore != null && awayScore != null) {
    return (
      <div className="shrink-0 text-center">
        <div className="display-num text-3xl font-700 text-offwhite sm:text-4xl">
          {homeScore} <span className="text-offwhite-faint">–</span> {awayScore}
        </div>
        <div className="text-[11px] font-600 uppercase tracking-wide text-gold-300">
          {status === 'live' ? (minute ? `${minute}'` : 'Live') : 'Full time'}
        </div>
      </div>
    );
  }
  return (
    <div className="shrink-0 text-center">
      <div className="display-num text-lg font-600 text-offwhite-dim">vs</div>
      <div className="text-[11px] text-offwhite-faint">{formatKickoff(kickoff)}</div>
    </div>
  );
}

function JerseyFallback2D({ homeColor, awayColor }: { homeColor: string; awayColor: string }) {
  return (
    <div className="flex h-full">
      <div className="flex-1" style={{ background: `linear-gradient(135deg, ${homeColor}, transparent)` }} />
      <div className="flex-1" style={{ background: `linear-gradient(225deg, ${awayColor}, transparent)` }} />
    </div>
  );
}
