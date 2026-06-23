import { describe, it, expect } from 'vitest';
import {
  applyResult,
  applyResults,
  DEFAULT_ELO_CONFIG,
  expectedHomeScore,
  goalDifferenceFactor,
  type EloRatings,
} from './elo';

describe('expectedHomeScore', () => {
  it('is 0.5 for equal ratings with no home advantage', () => {
    expect(expectedHomeScore(1800, 1800, 0)).toBeCloseTo(0.5, 10);
  });

  it('sums with the away expectation to 1', () => {
    const home = expectedHomeScore(1900, 1700, 0);
    const away = expectedHomeScore(1700, 1900, 0);
    expect(home + away).toBeCloseTo(1, 10);
  });

  it('rewards the higher-rated side', () => {
    expect(expectedHomeScore(2000, 1600, 0)).toBeGreaterThan(0.8);
  });
});

describe('goalDifferenceFactor', () => {
  it('matches the eloratings.net weighting', () => {
    expect(goalDifferenceFactor(0)).toBe(1);
    expect(goalDifferenceFactor(1)).toBe(1);
    expect(goalDifferenceFactor(-2)).toBe(1.5);
    expect(goalDifferenceFactor(3)).toBeCloseTo((11 + 3) / 8, 10);
  });
});

describe('applyResult', () => {
  const base: EloRatings = { AAA: 1800, BBB: 1800 };

  it('is zero-sum: winner gains exactly what loser loses', () => {
    const next = applyResult(base, { homeId: 'AAA', awayId: 'BBB', homeGoals: 1, awayGoals: 0 });
    const homeGain = next.AAA - base.AAA;
    const awayLoss = base.BBB - next.BBB;
    expect(homeGain).toBeCloseTo(awayLoss, 10);
    expect(homeGain).toBeGreaterThan(0);
  });

  it('does not mutate the input ratings', () => {
    applyResult(base, { homeId: 'AAA', awayId: 'BBB', homeGoals: 3, awayGoals: 0 });
    expect(base.AAA).toBe(1800);
  });

  it('moves ratings further on a bigger win', () => {
    const small = applyResult(base, { homeId: 'AAA', awayId: 'BBB', homeGoals: 1, awayGoals: 0 });
    const big = applyResult(base, { homeId: 'AAA', awayId: 'BBB', homeGoals: 4, awayGoals: 0 });
    expect(big.AAA).toBeGreaterThan(small.AAA);
  });

  it('applies home advantage only on non-neutral matches', () => {
    const neutral = applyResult(base, {
      homeId: 'AAA',
      awayId: 'BBB',
      homeGoals: 1,
      awayGoals: 1,
      neutral: true,
    });
    const athome = applyResult(base, {
      homeId: 'AAA',
      awayId: 'BBB',
      homeGoals: 1,
      awayGoals: 1,
      neutral: false,
    });
    // Even ratings + neutral + draw → expectation met exactly → no change.
    expect(neutral.AAA).toBeCloseTo(1800, 10);
    // A draw at home under-performs expectation (home was favored) → rating drops.
    expect(athome.AAA).toBeLessThan(neutral.AAA);
  });
});

describe('applyResults', () => {
  it('folds a sequence chronologically without mutating the seed', () => {
    const seed: EloRatings = { AAA: 1800, BBB: 1800 };
    const out = applyResults(
      seed,
      [
        { homeId: 'AAA', awayId: 'BBB', homeGoals: 2, awayGoals: 0, neutral: true },
        { homeId: 'AAA', awayId: 'BBB', homeGoals: 1, awayGoals: 0, neutral: true },
      ],
      DEFAULT_ELO_CONFIG,
    );
    expect(seed.AAA).toBe(1800);
    expect(out.AAA).toBeGreaterThan(1800);
    expect(out.BBB).toBeLessThan(1800);
  });
});
