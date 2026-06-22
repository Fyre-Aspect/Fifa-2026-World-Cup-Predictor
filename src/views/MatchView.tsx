import { useParams, Link } from 'react-router-dom';
import { ViewScaffold } from '@/components/ui/ViewScaffold';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Match detail view. Will show the pre-match prediction, live score, and
 * post-match analysis comparing prediction to result.
 */
export function MatchView() {
  const { matchId } = useParams();

  return (
    <ViewScaffold
      eyebrow="Match detail"
      title={`Fixture ${matchId ?? ''}`.trim()}
      description="Pre-match prediction with a confidence band, live score when in progress, and a post-match comparison of forecast against result."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="surface lg:col-span-2 aspect-video p-4">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
        <div className="surface space-y-3 p-4">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
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
