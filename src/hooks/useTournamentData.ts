import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { HOST_CITIES } from '@/data/cities';
import { MOCK_TEAMS_BY_ID } from '@/data/mockTeams';
import { buildMockBracket } from '@/data/mockBracket';
import { fetchTournamentData } from '@/api/football';
import { STALE_TIME } from '@/api/queryClient';

/**
 * Loads the tournament dataset (teams, fixtures) into the store.
 *
 * Tries the football-data API (via our proxy) with TanStack Query's
 * stale-while-revalidate cache; if no key is configured or the request fails,
 * it falls back to bundled mock data so the app is always usable. Cities are
 * static. Predictions are produced separately by useModel().
 */
export function useTournamentData(): void {
  const setTeams = useStore((s) => s.setTeams);
  const setCities = useStore((s) => s.setCities);
  const setMatches = useStore((s) => s.setMatches);
  const setDataSource = useStore((s) => s.setDataSource);

  const query = useQuery({
    queryKey: ['tournament'],
    queryFn: ({ signal }) => fetchTournamentData(signal),
    staleTime: STALE_TIME.fixtures,
    retry: 1,
  });

  useEffect(() => {
    setCities(HOST_CITIES);

    const live = query.data;
    setTeams(live ? live.teams : MOCK_TEAMS_BY_ID);
    setMatches(live ? live.matches : buildMockBracket());

    if (live) setDataSource('live');
    else if (query.isError) setDataSource('mock');
    else setDataSource('loading');
  }, [query.data, query.isError, setCities, setTeams, setMatches, setDataSource]);
}
