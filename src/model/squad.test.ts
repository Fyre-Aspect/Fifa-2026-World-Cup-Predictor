import { describe, it, expect } from 'vitest';
import { squadEloDiff, squadGoalFactor, squadStrength } from './squad';

describe('squadStrength', () => {
  it('rates a top side above a weaker one', () => {
    expect(squadStrength('FRA')).toBeGreaterThan(squadStrength('UZB'));
  });

  it('falls back to an Elo-derived rating for teams without a curated squad', () => {
    // PAN has no squad entry but is in the Elo seed → finite, reasonable rating.
    const s = squadStrength('PAN');
    expect(Number.isFinite(s)).toBe(true);
    expect(s).toBeGreaterThan(60);
    expect(s).toBeLessThan(95);
  });

  it('is symmetric to argument order in the diff', () => {
    expect(squadEloDiff('BRA', 'JPN')).toBeCloseTo(-squadEloDiff('JPN', 'BRA'), 10);
  });
});

describe('squadGoalFactor', () => {
  it('boosts the stronger side and is clamped within bounds', () => {
    const strong = squadGoalFactor('ESP', 'UZB');
    const weak = squadGoalFactor('UZB', 'ESP');
    expect(strong).toBeGreaterThan(1);
    expect(weak).toBeLessThan(1);
    expect(strong).toBeLessThanOrEqual(1.4);
    expect(weak).toBeGreaterThanOrEqual(0.72);
  });
});
