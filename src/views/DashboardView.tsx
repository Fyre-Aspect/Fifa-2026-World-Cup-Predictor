import { useMemo } from 'react';
import { ViewScaffold } from '@/components/ui/ViewScaffold';
import { CalibrationChart } from '@/components/model/CalibrationChart';
import { WeightEvolution } from '@/components/model/WeightEvolution';
import { FlipNumber } from '@/components/model/FlipNumber';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { calibrationBins, labelFromScore, type ScoredPrediction } from '@/model/scoring';
import { formatWeight, formatEloDelta } from '@/lib/format';
import type { ModelWeights } from '@/types/domain';

const WEIGHT_LABELS: Record<keyof ModelWeights, string> = {
  elo: 'Team strength (Elo)',
  form: 'Recent form',
  polymarket: 'Polymarket',
  books: 'Bookmaker consensus',
};

export function DashboardView() {
  const weights = useStore((s) => s.weights);
  const baseWeights = useStore((s) => s.baseWeights);
  const accuracy = useStore((s) => s.accuracy);
  const predictions = useStore((s) => s.predictions);
  const matches = useStore((s) => s.matches);
  const history = useStore((s) => s.weightHistory);
  const resetModel = useStore((s) => s.resetModel);

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

  const learnedFrom = Math.max(0, history.length - 1);

  return (
    <ViewScaffold
      eyebrow="Under the hood"
      title="Model dashboard"
      description="GroupStage keeps score of itself. Lower Brier and log loss are better; the calibration plot shows whether the model's confidence matches reality; and the weights chart shows the model learning which inputs to trust as results come in."
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
        <StatCard label="Baseline Brier" value="0.667" hint="a coin-flip (1/3 each)" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Current (learned) weights */}
        <section className="surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-600 uppercase tracking-wider text-offwhite-dim">
              Current weights
            </h2>
            <button
              onClick={resetModel}
              className="interactive rounded-md border border-pitch-600/50 px-2 py-1 text-[11px] text-offwhite-dim hover:text-offwhite"
            >
              Reset learning
            </button>
          </div>
          <ul className="space-y-3">
            {(Object.keys(WEIGHT_LABELS) as Array<keyof ModelWeights>).map((key) => {
              const delta = (weights[key] - baseWeights[key]) * 100;
              return (
                <li key={key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-offwhite">{WEIGHT_LABELS[key]}</span>
                    <span className="flex items-center gap-2">
                      {Math.abs(delta) >= 0.5 && (
                        <span className={delta > 0 ? 'text-pitch-200 text-[11px]' : 'text-red-300 text-[11px]'}>
                          {formatEloDelta(delta)}
                        </span>
                      )}
                      <FlipNumber value={formatWeight(weights[key])} className="display-num text-gold-300" />
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-pitch-900">
                    <motion.div
                      className="h-full rounded-full bg-gold-400/80"
                      animate={{ width: `${weights[key] * 100}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-offwhite-faint">
            Started at {Math.round(baseWeights.elo * 100)}/{Math.round(baseWeights.form * 100)}/
            {Math.round(baseWeights.polymarket * 100)}/{Math.round(baseWeights.books * 100)} ·
            learned from {learnedFrom} result{learnedFrom === 1 ? '' : 's'}. Tune the starting
            point from the panel in the header.
          </p>
        </section>

        {/* Weight evolution */}
        <section className="surface p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
            How the weights evolved
          </h2>
          <WeightEvolution history={history} />
        </section>
      </div>

      {/* Calibration */}
      <section className="surface mt-4 p-5">
        <h2 className="mb-4 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
          Calibration
        </h2>
        <div className="max-w-2xl">
          <CalibrationChart bins={bins} />
        </div>
        <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-offwhite-faint">
          Each bubble is a confidence band; points on the dashed line mean the
          model&rsquo;s stated probabilities match how often it&rsquo;s actually right.
        </p>
      </section>
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
