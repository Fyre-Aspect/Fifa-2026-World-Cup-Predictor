import { describe, it, expect } from 'vitest';
import { blendInputs, buildPrediction, predictionInterval } from './blend';
import type { InputDistributions, Outcome } from './types';
import type { ModelWeights } from '@/types/domain';

const WEIGHTS: ModelWeights = { elo: 0.25, form: 0.15, squad: 0.15, polymarket: 0.25, books: 0.2 };
const sum = (o: Outcome) => o.homeWin + o.draw + o.awayWin;

const homeHeavy: Outcome = { homeWin: 0.7, draw: 0.2, awayWin: 0.1 };
const awayHeavy: Outcome = { homeWin: 0.1, draw: 0.2, awayWin: 0.7 };

/** Build an InputDistributions with all inputs absent unless overridden. */
function inputs(partial: Partial<InputDistributions>): InputDistributions {
  return { elo: null, form: null, squad: null, polymarket: null, books: null, ...partial };
}

describe('blendInputs', () => {
  it('returns a normalized distribution', () => {
    expect(sum(blendInputs(inputs({ elo: homeHeavy, form: awayHeavy }), WEIGHTS))).toBeCloseTo(1, 10);
  });

  it('ignores missing inputs and renormalizes the weights', () => {
    // Only elo present → blend equals the elo distribution.
    const out = blendInputs(inputs({ elo: homeHeavy }), WEIGHTS);
    expect(out.homeWin).toBeCloseTo(homeHeavy.homeWin, 10);
  });

  it('lands between two opposing inputs', () => {
    const out = blendInputs(inputs({ elo: homeHeavy, polymarket: awayHeavy }), WEIGHTS);
    expect(out.homeWin).toBeLessThan(homeHeavy.homeWin);
    expect(out.homeWin).toBeGreaterThan(awayHeavy.homeWin);
  });

  it('falls back to uniform when nothing is present', () => {
    const out = blendInputs(inputs({}), WEIGHTS);
    expect(out.homeWin).toBeCloseTo(1 / 3, 10);
  });
});

describe('predictionInterval', () => {
  it('is wider with fewer inputs', () => {
    const one = inputs({ elo: homeHeavy });
    const four = inputs({ elo: homeHeavy, form: homeHeavy, polymarket: homeHeavy, books: homeHeavy });
    expect(predictionInterval(one)).toBeGreaterThan(predictionInterval(four));
  });

  it('is wider when inputs disagree', () => {
    const agree = inputs({ elo: homeHeavy, form: homeHeavy });
    const disagree = inputs({ elo: homeHeavy, form: awayHeavy });
    expect(predictionInterval(disagree)).toBeGreaterThan(predictionInterval(agree));
  });
});

describe('buildPrediction', () => {
  it('assembles a prediction whose probabilities sum to one', () => {
    const p = buildPrediction(
      'M1',
      inputs({ elo: homeHeavy, form: awayHeavy }),
      WEIGHTS,
      { home: 1.8, away: 0.9 },
      '2026-06-20T00:00:00Z',
    );
    expect(p.homeWin + p.draw + p.awayWin).toBeCloseTo(1, 10);
    expect(p.xgHome).toBeCloseTo(1.8, 10);
    expect(p.matchId).toBe('M1');
  });
});
