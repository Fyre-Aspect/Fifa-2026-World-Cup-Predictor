import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Flag } from '@/components/ui/Flag';
import { Skeleton } from '@/components/ui/Skeleton';
import { selectTitleContenders } from '@/lib/contenders';

/**
 * Top-3 teams by the model's estimated chance of lifting the trophy. Until the
 * model is trained (commit 4) there are no tournament-winner probabilities, so
 * this shows honest skeletons rather than inventing numbers.
 */
export function TopContenders() {
  const teams = useStore((s) => s.teams);
  const predictions = useStore((s) => s.predictions);
  const matches = useStore((s) => s.matches);

  const contenders = selectTitleContenders(teams, matches, predictions, 3);

  return (
    <div className="surface w-full max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-600 uppercase tracking-wider text-offwhite-dim">
          Predicted to lift the trophy
        </h2>
        <span className="text-[11px] text-offwhite-faint">model estimate</span>
      </div>
      <ul className="space-y-2">
        {contenders.length === 0
          ? [0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="display-num w-5 text-center text-lg font-700 text-gold-400">
                  {i + 1}
                </span>
                <Skeleton className="h-5 w-7 rounded-sm" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </li>
            ))
          : contenders.map((c, i) => (
              <li key={c.team.id}>
                <Link
                  to={`/team/${c.team.id}`}
                  className="interactive flex items-center gap-3 rounded-md px-1 py-1 hover:bg-pitch-700/40"
                >
                  <span className="display-num w-5 text-center text-lg font-700 text-gold-400">
                    {i + 1}
                  </span>
                  <Flag code={c.team.flagCode} title={c.team.name} className="h-5 w-7" />
                  <span className="flex-1 truncate text-sm font-500 text-offwhite">
                    {c.team.name}
                  </span>
                  <span className="display-num text-sm font-600 text-offwhite-dim">
                    {(c.probability * 100).toFixed(1)}%
                  </span>
                </Link>
              </li>
            ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-offwhite-faint">
        Estimated title odds, shown to one decimal — the precision the model can
        honestly support.
      </p>
    </div>
  );
}
