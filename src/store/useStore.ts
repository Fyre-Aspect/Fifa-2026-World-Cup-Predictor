import { create } from 'zustand';
import type {
  HostCity,
  Match,
  MatchPrediction,
  ModelAccuracy,
  ModelWeights,
  Team,
  WeightSnapshot,
} from '@/types/domain';

/** Default starting weights: Elo 25 / form 12 / squad 18 / market 25 / books 20. */
export const DEFAULT_WEIGHTS: ModelWeights = {
  elo: 0.25,
  form: 0.12,
  squad: 0.18,
  polymarket: 0.25,
  books: 0.2,
};

const EMPTY_ACCURACY: ModelAccuracy = {
  scoredMatches: 0,
  meanBrier: 0,
  meanLogLoss: 0,
};

/**
 * The single GroupStage store. Holds the tournament bracket, current
 * predictions, match history, and model weights — plus the small amount of
 * cross-view UI state (current selection, render toggles).
 */
export interface AppState {
  // ---- Tournament data ------------------------------------------------
  teams: Record<string, Team>;
  cities: HostCity[];
  /** All fixtures — the "bracket" — in stage order. */
  matches: Match[];

  // ---- Predictions & model -------------------------------------------
  predictions: Record<string, MatchPrediction>;
  /** User-tunable starting weights (the debug panel edits these). */
  baseWeights: ModelWeights;
  /** Effective weights after post-match learning — what predictions use. */
  weights: ModelWeights;
  /** Chronological log of weight changes, oldest first. */
  weightHistory: WeightSnapshot[];
  accuracy: ModelAccuracy;
  /** Current Elo ratings by team id, after replaying finished results. */
  ratings: Record<string, number>;

  // ---- UI / navigation state -----------------------------------------
  selectedCityId: string | null;
  selectedMatchId: string | null;
  selectedTeamId: string | null;
  /** Optional post-processing bloom on the 3D scene. Off by default. */
  bloomEnabled: boolean;
  /** Debug panel for tuning weights by hand. */
  debugOpen: boolean;
  /** Reduced 3D for small screens / low-power devices. */
  lowPower: boolean;
  /** Whether the tournament data is live from the API, bundled sample, or still loading. */
  dataSource: 'loading' | 'live' | 'mock';
  /** Human-readable provider for the data badge, e.g. "API-Football" or "Snapshot". */
  dataProvider: string | null;
  /** Epoch ms the tournament data was last (re)loaded; null until first load. */
  dataUpdatedAt: number | null;
  /** Whether the user has opted into browser match notifications. */
  notificationsEnabled: boolean;

  // ---- Actions --------------------------------------------------------
  setTeams: (teams: Record<string, Team>) => void;
  setCities: (cities: HostCity[]) => void;
  setMatches: (matches: Match[]) => void;
  upsertMatch: (match: Match) => void;

  setPrediction: (prediction: MatchPrediction) => void;
  setPredictions: (predictions: Record<string, MatchPrediction>) => void;

  setBaseWeights: (weights: ModelWeights) => void;
  setWeights: (weights: ModelWeights) => void;
  setWeightHistory: (history: WeightSnapshot[]) => void;
  pushWeightSnapshot: (snapshot: WeightSnapshot) => void;
  setAccuracy: (accuracy: ModelAccuracy) => void;
  setRatings: (ratings: Record<string, number>) => void;
  resetModel: () => void;

  selectCity: (id: string | null) => void;
  selectMatch: (id: string | null) => void;
  selectTeam: (id: string | null) => void;
  toggleBloom: () => void;
  toggleDebug: () => void;
  setLowPower: (low: boolean) => void;
  setDataSource: (source: 'loading' | 'live' | 'mock') => void;
  setDataMeta: (meta: {
    source: 'loading' | 'live' | 'mock';
    provider: string | null;
    updatedAt: number | null;
  }) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  teams: {},
  cities: [],
  matches: [],

  predictions: {},
  baseWeights: { ...DEFAULT_WEIGHTS },
  weights: { ...DEFAULT_WEIGHTS },
  weightHistory: [
    {
      matchId: null,
      weights: { ...DEFAULT_WEIGHTS },
      brier: null,
      timestamp: new Date().toISOString(),
    },
  ],
  accuracy: { ...EMPTY_ACCURACY },
  ratings: {},

  selectedCityId: null,
  selectedMatchId: null,
  selectedTeamId: null,
  bloomEnabled: false,
  debugOpen: false,
  lowPower: false,
  dataSource: 'loading',
  dataProvider: null,
  dataUpdatedAt: null,
  notificationsEnabled: false,

  setTeams: (teams) => set({ teams }),
  setCities: (cities) => set({ cities }),
  setMatches: (matches) => set({ matches }),
  upsertMatch: (match) =>
    set((s) => {
      const idx = s.matches.findIndex((m) => m.id === match.id);
      if (idx === -1) return { matches: [...s.matches, match] };
      const next = s.matches.slice();
      next[idx] = match;
      return { matches: next };
    }),

  setPrediction: (prediction) =>
    set((s) => ({
      predictions: { ...s.predictions, [prediction.matchId]: prediction },
    })),
  setPredictions: (predictions) =>
    set((s) => ({ predictions: { ...s.predictions, ...predictions } })),

  setBaseWeights: (baseWeights) => set({ baseWeights }),
  setWeights: (weights) => set({ weights }),
  setWeightHistory: (weightHistory) => set({ weightHistory }),
  pushWeightSnapshot: (snapshot) =>
    set((s) => ({ weightHistory: [...s.weightHistory, snapshot] })),
  setAccuracy: (accuracy) => set({ accuracy }),
  setRatings: (ratings) => set({ ratings }),
  resetModel: () =>
    set({
      baseWeights: { ...DEFAULT_WEIGHTS },
      weights: { ...DEFAULT_WEIGHTS },
      weightHistory: [
        {
          matchId: null,
          weights: { ...DEFAULT_WEIGHTS },
          brier: null,
          timestamp: new Date().toISOString(),
        },
      ],
      accuracy: { ...EMPTY_ACCURACY },
    }),

  selectCity: (id) => set({ selectedCityId: id }),
  selectMatch: (id) => set({ selectedMatchId: id }),
  selectTeam: (id) => set({ selectedTeamId: id }),
  toggleBloom: () => set((s) => ({ bloomEnabled: !s.bloomEnabled })),
  toggleDebug: () => set((s) => ({ debugOpen: !s.debugOpen })),
  setLowPower: (low) => set({ lowPower: low }),
  setDataSource: (source) => set({ dataSource: source }),
  setDataMeta: ({ source, provider, updatedAt }) =>
    set({ dataSource: source, dataProvider: provider, dataUpdatedAt: updatedAt }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
}));
