import { ViewScaffold } from '@/components/ui/ViewScaffold';
import { Skeleton } from '@/components/ui/Skeleton';
import { useStore, DEFAULT_WEIGHTS } from '@/store/useStore';

const WEIGHT_LABELS: Record<keyof typeof DEFAULT_WEIGHTS, string> = {
  elo: 'Team strength (Elo)',
  form: 'Recent form',
  polymarket: 'Polymarket',
  books: 'Bookmaker consensus',
};

/**
 * Model dashboard. Will host running accuracy, weight evolution, and a
 * calibration plot. For now it shows the live starting weights from the store
 * so the honesty story is real from day one.
 */
export function DashboardView() {
  const weights = useStore((s) => s.weights);

  return (
    <ViewScaffold
      eyebrow="Under the hood"
      title="Model dashboard"
      description="GroupStage keeps score of itself. This page tracks accuracy, shows how the input weights evolve as results come in, and plots calibration — proof the model is honest about what it knows."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Weights */}
        <section className="surface p-5 lg:col-span-1">
          <h2 className="mb-4 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
            Input weights
          </h2>
          <ul className="space-y-3">
            {(Object.keys(WEIGHT_LABELS) as Array<keyof typeof DEFAULT_WEIGHTS>).map((key) => (
              <li key={key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-offwhite">{WEIGHT_LABELS[key]}</span>
                  <span className="display-num text-gold-300">
                    {(weights[key] * 100).toFixed(0)}%
                  </span>
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
        </section>

        {/* Accuracy + calibration placeholders */}
        <section className="surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
            Running accuracy
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {['Brier score', 'Log loss', 'Matches scored'].map((label) => (
              <div key={label} className="surface-raised p-4">
                <Skeleton className="mb-2 h-8 w-16" />
                <p className="text-xs text-offwhite-faint">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </section>
      </div>
    </ViewScaffold>
  );
}
