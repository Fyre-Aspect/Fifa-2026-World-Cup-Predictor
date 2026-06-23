import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { runModel } from '@/model/predict';
import { summarizeAccuracy } from '@/model/scoring';
import { fetchBooksTable, fetchPolymarketTable } from '@/api/market';
import { STALE_TIME } from '@/api/queryClient';

/**
 * Runs the full prediction model over the loaded fixtures and writes the
 * results into the store: per-match predictions, running accuracy, current Elo
 * ratings, the learned (evolved) weights, and the weight history. Market inputs
 * (Polymarket + bookmakers) are fetched via TanStack Query and folded in when
 * available; without them the model leans on Elo + form.
 *
 * The pass is deterministic from (fixtures, base weights, market), so writing
 * the evolved `weights` back to the store does not feed back into the run — the
 * input is `baseWeights`, the output is `weights`.
 */
export function useModel(): void {
  const matches = useStore((s) => s.matches);
  const teams = useStore((s) => s.teams);
  const baseWeights = useStore((s) => s.baseWeights);
  const setPredictions = useStore((s) => s.setPredictions);
  const setAccuracy = useStore((s) => s.setAccuracy);
  const setRatings = useStore((s) => s.setRatings);
  const setWeights = useStore((s) => s.setWeights);
  const setWeightHistory = useStore((s) => s.setWeightHistory);

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
    const result = runModel(matches, baseWeights, market ?? {});
    setPredictions(result.predictions);
    setAccuracy(summarizeAccuracy(result.scored));
    setRatings(result.ratings);
    setWeights(result.weights);
    setWeightHistory(result.history);
  }, [
    matches,
    baseWeights,
    market,
    setPredictions,
    setAccuracy,
    setRatings,
    setWeights,
    setWeightHistory,
  ]);
}
