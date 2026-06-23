import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { replayPredictions } from '@/model/predict';
import { summarizeAccuracy } from '@/model/scoring';
import { fetchBooksTable, fetchPolymarketTable } from '@/api/market';
import { STALE_TIME } from '@/api/queryClient';

/**
 * Runs the prediction model over the loaded fixtures and writes the results
 * into the store: per-match predictions, running accuracy, and current Elo
 * ratings. Market inputs (Polymarket + bookmakers) are fetched via TanStack
 * Query and folded in when available; without them the model leans on Elo +
 * form. Recomputes whenever fixtures, weights, or market data change.
 */
export function useModel(): void {
  const matches = useStore((s) => s.matches);
  const teams = useStore((s) => s.teams);
  const weights = useStore((s) => s.weights);
  const setPredictions = useStore((s) => s.setPredictions);
  const setAccuracy = useStore((s) => s.setAccuracy);
  const setRatings = useStore((s) => s.setRatings);

  const teamCount = Object.keys(teams).length;

  const marketQuery = useQuery({
    queryKey: ['market', matches.length, teamCount],
    queryFn: async ({ signal }) => {
      const [books, polymarket] = await Promise.all([
        fetchBooksTable(teams, matches, signal),
        fetchPolymarketTable(teams, matches, signal),
      ]);
      return { books, polymarket };
    },
    enabled: matches.length > 0 && teamCount > 0,
    staleTime: STALE_TIME.odds,
    retry: 0,
  });

  const market = marketQuery.data;

  useEffect(() => {
    if (matches.length === 0) return;
    const { predictions, scored, ratings } = replayPredictions(matches, weights, market ?? {});
    setPredictions(predictions);
    setAccuracy(summarizeAccuracy(scored));
    setRatings(ratings);
  }, [matches, weights, market, setPredictions, setAccuracy, setRatings]);
}
