import { useMemo } from 'react';
import { ViewScaffold } from '@/components/ui/ViewScaffold';
import { CalibrationChart } from '@/components/model/CalibrationChart';
import { useStore, DEFAULT_WEIGHTS } from '@/store/useStore';
import { calibrationBins, labelFromScore, type ScoredPrediction } from '@/model/scoring';
import type { ModelWeights } from '@/types/domain';

const WEIGHT_LABELS: Record<keyof ModelWeights, string> = {
  elo: 'Team strength (Elo)',
  form: 'Recent form',
  polymarket: 'Polymarket',
  books: 'Bookmaker consensus',
};

export function DashboardView() {
  const weights = useStore((s) => s.weights);
  const accuracy = useStore((s) => s.accuracy);
  const predictions = useStore((s) => s.predictions);
  const matches = useStore((s) => s.matches);

  const bins = useMemo(() => {
    const scored: ScoredPrediction[] = [];
    for (const m of matches) {
      if (m.status !== 'finished' || !m.score) continue;
      const p = predictions[m.id];
      if (!p) continue;
      scored.push({
        pred: { homeWin: p.homeWin, draw: p.draw, awayWin: p.awayWin },
        actual: labelFromScore(m.score),
      });
    }
    return calibrationBins(scored, 5);
  }, [matches, predictions]);

  return (
    <ViewScaffold
      eyebrow="Under the hood"
      title="Model dashboard"
      description="GroupStage keeps score of itself. Lower Brier and log loss are better; the calibration plot shows whether the model's confidence matches reality. This is the honest core — proof of what the model does and doesn't know."
    >
      {/* Accuracy stats */}
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Brier score"
          value={accuracy.scoredMatches > 0 ? accuracy.meanBrier.toFixed(3) : '—'}
          hint="0 = perfect, lower is better"
        />
        <StatCard
          label="Log loss"
          value={accuracy.scoredMatches > 0 ? accuracy.meanLogLoss.toFixed(3) : '—'}
          hint="lower is better"
        />
        <StatCard label="Matches scored" value={String(accuracy.scoredMatches)} hint="finished games" />
        <StatCard
          label="Baseline Brier"
          value="0.667"
          hint="a coin-flip (1/3 each)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Weights */}
        <section className="surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
            Input weights
          </h2>
          <ul className="space-y-3">
            {(Object.keys(WEIGHT_LABELS) as Array<keyof ModelWeights>).map((key) => (
              <li key={key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-offwhite">{WEIGHT_LABELS[key]}</span>
                  <span className="display-num text-gold-300">{(weights[key] * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-pitch-900">
                  <div
                    className="h-full rounded-full bg-gold-400/80 transition-[width] duration-500"
                    style={{ width: `${weights[key] * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-offwhite-faint">
            Defaults: Elo {Math.round(DEFAULT_WEIGHTS.elo * 100)}% · form{' '}
            {Math.round(DEFAULT_WEIGHTS.form * 100)}% · Polymarket{' '}
            {Math.round(DEFAULT_WEIGHTS.polymarket * 100)}% · books{' '}
            {Math.round(DEFAULT_WEIGHTS.books * 100)}%. Tune them from the panel in the header.
          </p>
        </section>

        {/* Calibration */}
        <section className="surface p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
            Calibration
          </h2>
          <CalibrationChart bins={bins} />
          <p className="mt-3 text-[11px] leading-relaxed text-offwhite-faint">
            Each bubble is a confidence band; points on the dashed line mean the
            model&rsquo;s stated probabilities match how often it&rsquo;s actually right.
          </p>
        </section>
      </div>
    </ViewScaffold>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="surface p-4">
      <div className="display-num text-2xl font-700 text-offwhite">{value}</div>
      <div className="mt-1 text-xs font-500 text-offwhite-dim">{label}</div>
      <div className="text-[10px] text-offwhite-faint">{hint}</div>
    </div>
  );
}
