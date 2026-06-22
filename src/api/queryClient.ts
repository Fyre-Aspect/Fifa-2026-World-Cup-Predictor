import { QueryClient } from '@tanstack/react-query';

/** Per-endpoint stale times (ms), tuned to how fast each source changes. */
export const STALE_TIME = {
  /** Fixtures, teams, groups change at most a few times a day. */
  fixtures: 60 * 60 * 1000,
  /** Live scores during a match. */
  liveScores: 30 * 1000,
  /** Polymarket implied odds. */
  polymarket: 60 * 1000,
  /** Bookmaker odds. */
  odds: 60 * 1000,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
