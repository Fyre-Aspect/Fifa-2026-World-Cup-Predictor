import { describe, it, expect } from 'vitest';
import { gradientStep } from './learn';
import type { InputDistributions } from './types';
import type { ModelWeights } from '@/types/domain';

const WEIGHTS: ModelWeights = { elo: 0.3, form: 0.15, polymarket: 0.3, books: 0.25 };

const homeHeavy = { homeWin: 0.75, draw: 0.15, awayWin: 0.1 };
const awayHeavy = { homeWin: 0.1, draw: 0.15, awayWin: 0.75 };

const sumWeights = (w: ModelWeights) => w.elo + w.form + w.polymarket + w.books;

describe('gradientStep', () => {
  it('keeps weights on the simplex (sum to 1, non-negative)', () => {
    const inputs: InputDistributions = { elo: homeHeavy, form: awayHeavy, polymarket: null, books: null };
    const { weights } = gradientStep(WEIGHTS, inputs, 'away');
    expect(sumWeights(weights)).toBeCloseTo(1, 10);
    for (const k of ['elo', 'form', 'polymarket', 'books'] as const) {
      expect(weights[k]).toBeGreaterThanOrEqual(0);
    }
  });

  it('shifts weight toward the input that was more correct', () => {
    // elo said home, form said away, and away actually won → form gains over elo.
    const inputs: InputDistributions = { elo: homeHeavy, form: awayHeavy, polymarket: null, books: null };
    const { weights } = gradientStep(WEIGHTS, inputs, 'away', 0.1);
    const eloShare = weights.elo / (weights.elo + weights.form);
    const baseShare = WEIGHTS.elo / (WEIGHTS.elo + WEIGHTS.form);
    expect(eloShare).toBeLessThan(baseShare); // the wrong input (elo) lost relative weight
  });

  it('does not move absent inputs much beyond renormalization', () => {
    const inputs: InputDistributions = { elo: homeHeavy, form: null, polymarket: null, books: null };
    const before = WEIGHTS.books / (WEIGHTS.polymarket + WEIGHTS.books);
    const { weights } = gradientStep(WEIGHTS, inputs, 'home', 0.1);
    const after = weights.books / (weights.polymarket + weights.books);
    // polymarket & books were both absent → their ratio is preserved.
    expect(after).toBeCloseTo(before, 6);
  });

  it('reports the blended Brier and per-input Brier', () => {
    const inputs: InputDistributions = { elo: homeHeavy, form: awayHeavy, polymarket: null, books: null };
    const step = gradientStep(WEIGHTS, inputs, 'home');
    expect(step.brier).toBeGreaterThan(0);
    // elo (which favored home) should score better than form on a home win.
    expect(step.perInputBrier.elo).toBeLessThan(step.perInputBrier.form as number);
  });
});
