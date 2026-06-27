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

interface AvailableProviders {
  apiFootball: boolean;
  footballData: boolean;
}

/**
 * Which live providers actually have a key configured, per the proxy's /health.
 * We check this first so we never fire a request at a provider with no key —
 * that request would 503 and spam the browser console even though the fallback
 * works. Cached after the first successful check (keys don't change at runtime).
 */
let cachedProviders: AvailableProviders | null = null;

async function getAvailableProviders(): Promise<AvailableProviders> {
  if (cachedProviders) return cachedProviders;
  try {
    const res = await fetch('/api/health', { headers: { accept: 'application/json' } });
    if (res.ok) {
      const json = (await res.json()) as { services?: Partial<AvailableProviders> };
      cachedProviders = {
        apiFootball: Boolean(json.services?.apiFootball),
        footballData: Boolean(json.services?.footballData),
      };
      return cachedProviders;
    }
  } catch {
    // Health unreachable — don't cache; fall through to a best-effort attempt.
  }
  // If we can't determine, still try football-data (the common single-key setup).
  return { apiFootball: false, footballData: true };
}

/**
 * Tries each configured live provider in priority order, returning the first
 * that yields fixtures. API-Football is preferred when keyed (richer live data);
 * football-data.org is the other supported source — its free tier covers the
 * World Cup. Providers with no key are skipped entirely (no wasted 503). Throws
 * if none are configured or all fail, so the caller drops to the snapshot.
 */
async function fetchLiveTournament(signal?: AbortSignal): Promise<LiveResult> {
  const providers = await getAvailableProviders();

  if (providers.apiFootball) {
    try {
      const data = await fetchTournamentDataApiFootball(signal);
      return { ...data, provider: 'API-Football' };
    } catch {
      // Fall through to the next configured provider.
    }
  }

  if (providers.footballData) {
    const data = await fetchTournamentData(signal);
    return { ...data, provider: 'football-data.org' };
  }

  throw new Error('no_live_provider');
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
