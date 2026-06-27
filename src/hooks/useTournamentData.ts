import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { HOST_CITIES } from '@/data/cities';
import { MOCK_TEAMS_BY_ID } from '@/data/mockTeams';
import { buildMockBracket } from '@/data/mockBracket';
import { RESULTS_AS_OF } from '@/data/realResults';
import { fetchTournamentData, type TournamentData } from '@/api/football';
import { fetchTournamentDataApiFootball } from '@/api/apiFootball';
import { STALE_TIME } from '@/api/queryClient';

interface LiveResult extends TournamentData {
  provider: string;
}

/**
 * Tries each live provider in priority order, returning the first that yields
 * fixtures. API-Football is primary (its free tier covers the World Cup);
 * football-data.org is a secondary fallback. Throws if none work, so the caller
 * drops to the bundled snapshot.
 */
async function fetchLiveTournament(signal?: AbortSignal): Promise<LiveResult> {
  try {
    const data = await fetchTournamentDataApiFootball(signal);
    return { ...data, provider: 'API-Football' };
  } catch {
    // Fall through to the secondary provider.
  }
  const data = await fetchTournamentData(signal);
  return { ...data, provider: 'football-data.org' };
}

/**
 * Loads the tournament dataset (teams, fixtures) into the store.
 *
 * Tries the live providers (via our proxy) with TanStack Query's
 * stale-while-revalidate cache; if no key is configured or every request fails,
 * it falls back to the bundled snapshot so the app is always usable. Cities are
 * static. Predictions are produced separately by useModel(). The store also
 * records which source is in use and when it was last refreshed, for the
 * data-source badge.
 */
export function useTournamentData(): void {
  const setCities = useStore((s) => s.setCities);
  const setTeams = useStore((s) => s.setTeams);
  const setMatches = useStore((s) => s.setMatches);
  const setDataMeta = useStore((s) => s.setDataMeta);

  const query = useQuery({
    queryKey: ['tournament'],
    queryFn: ({ signal }) => fetchLiveTournament(signal),
    staleTime: STALE_TIME.fixtures,
    retry: 1,
    // Poll for live scores only while a match is in progress.
    refetchInterval: (q) => {
      const live = q.state.data?.matches.some((m) => m.status === 'live');
      return live ? STALE_TIME.liveScores : false;
    },
  });

  useEffect(() => {
    setCities(HOST_CITIES);

    const live = query.data;
    setTeams(live ? live.teams : MOCK_TEAMS_BY_ID);
    setMatches(live ? live.matches : buildMockBracket());

    if (live) {
      setDataMeta({ source: 'live', provider: live.provider, updatedAt: query.dataUpdatedAt });
    } else if (query.isError) {
      setDataMeta({ source: 'mock', provider: 'Snapshot', updatedAt: Date.parse(RESULTS_AS_OF) });
    } else {
      setDataMeta({ source: 'loading', provider: null, updatedAt: null });
    }
  }, [query.data, query.isError, query.dataUpdatedAt, setCities, setTeams, setMatches, setDataMeta]);
}
