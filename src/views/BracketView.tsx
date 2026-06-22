import { ViewScaffold } from '@/components/ui/ViewScaffold';
import { Skeleton } from '@/components/ui/Skeleton';

const TIERS = ['Final', 'Semi-finals', 'Quarter-finals', 'Round of 16', 'Round of 32', 'Group stage'];

/**
 * Bracket view. Becomes a 3D tournament tree suspended in space in the next
 * commit; for now it lays out the tier structure as a 2D scaffold.
 */
export function BracketView() {
  return (
    <ViewScaffold
      eyebrow="Tournament tree"
      title="The road to the final"
      description="A 48-team field across 12 groups, narrowing through the knockouts. Tap any match to reveal its prediction and confidence band."
    >
      <div className="space-y-4">
        {TIERS.map((tier, ti) => (
          <section key={tier} className="surface p-4">
            <h2 className="mb-3 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
              {tier}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: Math.max(1, 2 ** (TIERS.length - 1 - ti) / 4) | 0 || 1 }).map(
                (_, i) => (
                  <div key={i} className="surface-raised flex flex-col gap-2 p-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-6" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-6" />
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </ViewScaffold>
  );
}
