import { describe, it, expect } from 'vitest';
import { blendInputs, buildPrediction, predictionInterval } from './blend';
import type { InputDistributions, Outcome } from './types';
import type { ModelWeights } from '@/types/domain';

const WEIGHTS: ModelWeights = { elo: 0.3, form: 0.15, polymarket: 0.3, books: 0.25 };
const sum = (o: Outcome) => o.homeWin + o.draw + o.awayWin;

const homeHeavy: Outcome = { homeWin: 0.7, draw: 0.2, awayWin: 0.1 };
const awayHeavy: Outcome = { homeWin: 0.1, draw: 0.2, awayWin: 0.7 };

describe('blendInputs', () => {
  it('returns a normalized distribution', () => {
    const inputs: InputDistributions = {
      elo: homeHeavy,
      form: awayHeavy,
      polymarket: null,
      books: null,
    };
    expect(sum(blendInputs(inputs, WEIGHTS))).toBeCloseTo(1, 10);
  });

  it('ignores missing inputs and renormalizes the weights', () => {
    // Only elo present → blend equals the elo distribution.
    const inputs: InputDistributions = { elo: homeHeavy, form: null, polymarket: null, books: null };
    const out = blendInputs(inputs, WEIGHTS);
    expect(out.homeWin).toBeCloseTo(homeHeavy.homeWin, 10);
  });

  it('lands between two opposing inputs', () => {
    const inputs: InputDistributions = {
      elo: homeHeavy,
      form: null,
      polymarket: awayHeavy,
      books: null,
    };
    const out = blendInputs(inputs, WEIGHTS);
    expect(out.homeWin).toBeLessThan(homeHeavy.homeWin);
    expect(out.homeWin).toBeGreaterThan(awayHeavy.homeWin);
  });

  it('falls back to uniform when nothing is present', () => {
    const inputs: InputDistributions = { elo: null, form: null, polymarket: null, books: null };
    const out = blendInputs(inputs, WEIGHTS);
    expect(out.homeWin).toBeCloseTo(1 / 3, 10);
  });
});

describe('predictionInterval', () => {
  it('is wider with fewer inputs', () => {
    const one: InputDistributions = { elo: homeHeavy, form: null, polymarket: null, books: null };
    const four: InputDistributions = {
      elo: homeHeavy,
      form: homeHeavy,
      polymarket: homeHeavy,
      books: homeHeavy,
    };
    expect(predictionInterval(one)).toBeGreaterThan(predictionInterval(four));
  });

  it('is wider when inputs disagree', () => {
    const agree: InputDistributions = {
      elo: homeHeavy,
      form: homeHeavy,
      polymarket: null,
      books: null,
    };
    const disagree: InputDistributions = {
      elo: homeHeavy,
      form: awayHeavy,
      polymarket: null,
      books: null,
    };
    expect(predictionInterval(disagree)).toBeGreaterThan(predictionInterval(agree));
  });
});

describe('buildPrediction', () => {
  it('assembles a prediction whose probabilities sum to one', () => {
    const inputs: InputDistributions = {
      elo: homeHeavy,
      form: awayHeavy,
      polymarket: null,
      books: null,
    };
    const p = buildPrediction('M1', inputs, WEIGHTS, { home: 1.8, away: 0.9 }, '2026-06-20T00:00:00Z');
    expect(p.homeWin + p.draw + p.awayWin).toBeCloseTo(1, 10);
    expect(p.xgHome).toBeCloseTo(1.8, 10);
    expect(p.matchId).toBe('M1');
  });
});
