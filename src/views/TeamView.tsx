import { useParams, Link } from 'react-router-dom';
import { ViewScaffold } from '@/components/ui/ViewScaffold';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Team page. Will show a 3D rotating jersey, four years of results, an Elo
 * trajectory chart, and the team's predicted tournament run.
 */
export function TeamView() {
  const { teamId } = useParams();

  return (
    <ViewScaffold
      eyebrow="Team"
      title={`${teamId?.toUpperCase() ?? 'Team'}`}
      description="Strength trajectory, recent results, and the model's predicted run through the tournament."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="surface aspect-[3/4] p-4">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
        <div className="surface space-y-3 p-4 lg:col-span-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
      <Link
        to="/bracket"
        className="mt-6 inline-block text-sm font-500 text-gold-300 hover:text-gold-200"
      >
        ← Back to bracket
      </Link>
    </ViewScaffold>
  );
}
