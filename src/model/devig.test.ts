import { describe, it, expect } from 'vitest';
import {
  deVig,
  deVigThreeWay,
  deVigTwoWayWithDraw,
  impliedFromDecimal,
} from './devig';

const sum = (o: { homeWin: number; draw: number; awayWin: number }) =>
  o.homeWin + o.draw + o.awayWin;

describe('impliedFromDecimal', () => {
  it('inverts decimal odds', () => {
    expect(impliedFromDecimal(2)).toBeCloseTo(0.5, 10);
    expect(impliedFromDecimal(4)).toBeCloseTo(0.25, 10);
  });

  it('rejects invalid odds', () => {
    expect(impliedFromDecimal(1)).toBe(0);
    expect(impliedFromDecimal(0)).toBe(0);
  });
});

describe('deVig', () => {
  it('normalizes an overround to sum to one', () => {
    const out = deVig([0.5, 0.35, 0.3]); // sums to 1.15 (15% overround)
    expect(out.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it('preserves relative ordering', () => {
    const out = deVig([0.6, 0.3, 0.25]);
    expect(out[0]).toBeGreaterThan(out[1]);
    expect(out[1]).toBeGreaterThan(out[2]);
  });
});

describe('deVigThreeWay', () => {
  it('produces a normalized outcome from decimal odds', () => {
    const o = deVigThreeWay(2.0, 3.4, 4.2);
    expect(sum(o)).toBeCloseTo(1, 10);
    expect(o.homeWin).toBeGreaterThan(o.awayWin);
  });
});

describe('deVigTwoWayWithDraw', () => {
  it('folds in a draw prior and stays normalized', () => {
    const o = deVigTwoWayWithDraw(1.8, 2.1, 0.26);
    expect(sum(o)).toBeCloseTo(1, 10);
    expect(o.draw).toBeCloseTo(0.26, 10);
  });
});
