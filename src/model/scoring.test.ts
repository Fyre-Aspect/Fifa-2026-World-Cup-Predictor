import { describe, it, expect } from 'vitest';
import {
  brierScore,
  calibrationBins,
  labelFromScore,
  logLoss,
  summarizeAccuracy,
  type ScoredPrediction,
} from './scoring';
import type { Outcome } from './types';

const certainHome: Outcome = { homeWin: 1, draw: 0, awayWin: 0 };
const uniform: Outcome = { homeWin: 1 / 3, draw: 1 / 3, awayWin: 1 / 3 };

describe('labelFromScore', () => {
  it('reads the winner from the score', () => {
    expect(labelFromScore({ home: 2, away: 1 })).toBe('home');
    expect(labelFromScore({ home: 0, away: 3 })).toBe('away');
    expect(labelFromScore({ home: 1, away: 1 })).toBe('draw');
  });
});

describe('brierScore', () => {
  it('is zero for a correct, certain prediction', () => {
    expect(brierScore(certainHome, 'home')).toBeCloseTo(0, 10);
  });

  it('is 2 for a wrong, certain prediction', () => {
    expect(brierScore(certainHome, 'away')).toBeCloseTo(2, 10);
  });

  it('penalizes uncertainty modestly', () => {
    expect(brierScore(uniform, 'home')).toBeGreaterThan(0);
    expect(brierScore(uniform, 'home')).toBeLessThan(1);
  });
});

describe('logLoss', () => {
  it('is near zero for a confident, correct call', () => {
    expect(logLoss({ homeWin: 0.99, draw: 0.005, awayWin: 0.005 }, 'home')).toBeLessThan(0.02);
  });

  it('is large for a confident, wrong call', () => {
    expect(logLoss({ homeWin: 0.99, draw: 0.005, awayWin: 0.005 }, 'away')).toBeGreaterThan(3);
  });
});

describe('summarizeAccuracy', () => {
  it('averages Brier and log loss across predictions', () => {
    const scored: ScoredPrediction[] = [
      { pred: certainHome, actual: 'home' },
      { pred: certainHome, actual: 'away' },
    ];
    const s = summarizeAccuracy(scored);
    expect(s.scoredMatches).toBe(2);
    expect(s.meanBrier).toBeCloseTo(1, 10); // (0 + 2) / 2
  });

  it('handles the empty case', () => {
    expect(summarizeAccuracy([]).scoredMatches).toBe(0);
  });
});

describe('calibrationBins', () => {
  it('returns the requested number of bins', () => {
    const scored: ScoredPrediction[] = [
      { pred: { homeWin: 0.6, draw: 0.25, awayWin: 0.15 }, actual: 'home' },
      { pred: { homeWin: 0.9, draw: 0.05, awayWin: 0.05 }, actual: 'home' },
    ];
    expect(calibrationBins(scored, 5)).toHaveLength(5);
  });

  it('records observed frequency in the right direction', () => {
    const scored: ScoredPrediction[] = Array.from({ length: 10 }, () => ({
      pred: { homeWin: 0.9, draw: 0.05, awayWin: 0.05 },
      actual: 'home' as const,
    }));
    const bins = calibrationBins(scored, 5);
    const top = bins[bins.length - 1];
    expect(top.observed).toBeCloseTo(1, 10);
    expect(top.count).toBe(10);
  });
});
