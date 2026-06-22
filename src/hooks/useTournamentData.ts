import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { HOST_CITIES } from '@/data/cities';
import { MOCK_TEAMS_BY_ID } from '@/data/mockTeams';
import { buildMockBracket } from '@/data/mockBracket';
import { buildMockPredictions } from '@/data/mockPredictions';

/**
 * Seeds the store with the tournament dataset. For now this is bundled mock
 * data; commit 3 swaps the body for TanStack Query against the football-data
 * API, falling back to this same mock data when no key is configured.
 */
export function useTournamentData(): void {
  const setTeams = useStore((s) => s.setTeams);
  const setCities = useStore((s) => s.setCities);
  const setMatches = useStore((s) => s.setMatches);
  const setPredictions = useStore((s) => s.setPredictions);

  useEffect(() => {
    const matches = buildMockBracket();
    setCities(HOST_CITIES);
    setTeams(MOCK_TEAMS_BY_ID);
    setMatches(matches);
    // Placeholder predictions until the real model is wired (commit 4).
    setPredictions(buildMockPredictions(matches));
  }, [setTeams, setCities, setMatches, setPredictions]);
}
