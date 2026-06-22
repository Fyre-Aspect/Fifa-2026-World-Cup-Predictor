import { ViewScaffold } from '@/components/ui/ViewScaffold';
import { Skeleton } from '@/components/ui/Skeleton';

/** Tier label and how many placeholder cards to show (capped for layout). */
const TIERS: Array<{ label: string; cards: number }> = [
  { label: 'Final', cards: 1 },
  { label: 'Semi-finals', cards: 2 },
  { label: 'Quarter-finals', cards: 4 },
  { label: 'Round of 16', cards: 8 },
  { label: 'Round of 32', cards: 8 },
  { label: 'Group stage', cards: 8 },
];

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
        {TIERS.map((tier) => (
          <section key={tier.label} className="surface p-4">
            <h2 className="mb-3 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
              {tier.label}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: tier.cards }).map((_, i) => (
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
              ))}
            </div>
          </section>
        ))}
      </div>
    </ViewScaffold>
  );
}
