import { describe, it, expect } from 'vitest';
import {
  mostLikelyScore,
  outcomeFromXg,
  poisson,
  scoreMatrix,
  topScorelines,
} from './scoreline';

describe('poisson', () => {
  it('is a valid pmf that sums to ~1 over its support', () => {
    let total = 0;
    for (let k = 0; k <= 20; k++) total += poisson(k, 2.3);
    expect(total).toBeCloseTo(1, 4);
  });
});

describe('scoreMatrix', () => {
  it('produces joint probabilities that sum to ~1', () => {
    const total = scoreMatrix(1.8, 1.1).reduce((s, c) => s + c.prob, 0);
    expect(total).toBeCloseTo(1, 3);
  });
});

describe('mostLikelyScore', () => {
  it('favors the stronger side in its modal scoreline', () => {
    const s = mostLikelyScore(2.4, 0.7);
    expect(s.home).toBeGreaterThanOrEqual(s.away);
  });

  it('returns 0-0 as the mode for two weak attacks', () => {
    const s = mostLikelyScore(0.4, 0.4);
    expect(s.home).toBe(0);
    expect(s.away).toBe(0);
  });
});

describe('topScorelines', () => {
  it('returns distinct scorelines in descending probability', () => {
    const top = topScorelines(1.6, 1.2, 4);
    expect(top).toHaveLength(4);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].prob).toBeGreaterThanOrEqual(top[i].prob);
    }
  });
});

describe('outcomeFromXg', () => {
  it('gives the favorite the highest win probability and normalizes', () => {
    const o = outcomeFromXg(2.2, 0.9);
    expect(o.homeWin).toBeGreaterThan(o.awayWin);
    expect(o.homeWin + o.draw + o.awayWin).toBeCloseTo(1, 6);
  });
});
