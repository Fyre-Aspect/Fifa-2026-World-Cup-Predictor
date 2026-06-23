import type { MatchPrediction, MatchScore } from '@/types/domain';
import { brierScore, labelFromScore } from '@/model/scoring';
import { argmaxOutcome } from '@/model/probability';
import { formatProbability } from '@/lib/format';

/** Compares the pre-match prediction to the actual result, honestly. */
export function PostMatchAnalysis({
  prediction,
  score,
  homeName,
  awayName,
}: {
  prediction: MatchPrediction;
  score: MatchScore;
  homeName: string;
  awayName: string;
}) {
  const outcome = {
    homeWin: prediction.homeWin,
    draw: prediction.draw,
    awayWin: prediction.awayWin,
  };
  const actual = labelFromScore(score);
  const predicted = argmaxOutcome(outcome);
  const brier = brierScore(outcome, actual);
  const hit = predicted === actual;

  const labelText = (l: 'home' | 'draw' | 'away') =>
    l === 'home' ? `${homeName} win` : l === 'away' ? `${awayName} win` : 'Draw';
  const probForActual =
    actual === 'home' ? outcome.homeWin : actual === 'away' ? outcome.awayWin : outcome.draw;

  return (
    <section className="surface p-5">
      <h2 className="mb-4 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
        Prediction vs result
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Model's pick" value={labelText(predicted)} />
        <Stat label="Actual result" value={labelText(actual)} />
        <Stat label="Prob. of actual" value={formatProbability(probForActual)} mono />
        <Stat label="Brier score" value={brier.toFixed(3)} mono tone={brier < 0.5 ? 'good' : brier > 1 ? 'bad' : 'neutral'} />
      </div>
      <p className="mt-4 text-sm text-offwhite-dim">
        {hit
          ? `The model's most likely outcome landed. It gave this result ${formatProbability(probForActual)} beforehand.`
          : `An upset relative to the model — it had the actual result at only ${formatProbability(probForActual)}. Lower Brier is better; this one counts against the running score.`}
      </p>
    </section>
  );
}

function Stat({
  label,
  value,
  mono,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'good' | 'bad' | 'neutral';
}) {
  const toneClass =
    tone === 'good' ? 'text-pitch-200' : tone === 'bad' ? 'text-red-300' : 'text-offwhite';
  return (
    <div className="surface-raised p-3">
      <div className={`${mono ? 'display-num' : 'font-display'} text-lg font-600 ${toneClass}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-offwhite-faint">{label}</div>
    </div>
  );
}
