import { describe, it, expect } from 'vitest';
import {
  argmaxOutcome,
  normalizeOutcome,
  outcomeFromEloDiff,
} from './probability';

const sum = (o: { homeWin: number; draw: number; awayWin: number }) =>
  o.homeWin + o.draw + o.awayWin;

describe('outcomeFromEloDiff', () => {
  it('produces a normalized distribution', () => {
    for (const diff of [-400, -100, 0, 100, 400]) {
      expect(sum(outcomeFromEloDiff(diff))).toBeCloseTo(1, 10);
    }
  });

  it('is symmetric at zero difference', () => {
    const o = outcomeFromEloDiff(0);
    expect(o.homeWin).toBeCloseTo(o.awayWin, 10);
  });

  it('raises home win probability as the gap grows', () => {
    expect(outcomeFromEloDiff(200).homeWin).toBeGreaterThan(
      outcomeFromEloDiff(50).homeWin,
    );
  });

  it('peaks draw probability when sides are even', () => {
    expect(outcomeFromEloDiff(0).draw).toBeGreaterThan(outcomeFromEloDiff(300).draw);
  });
});

describe('normalizeOutcome', () => {
  it('scales to sum to one', () => {
    const o = normalizeOutcome({ homeWin: 2, draw: 1, awayWin: 1 });
    expect(sum(o)).toBeCloseTo(1, 10);
    expect(o.homeWin).toBeCloseTo(0.5, 10);
  });

  it('falls back to uniform for degenerate input', () => {
    const o = normalizeOutcome({ homeWin: 0, draw: 0, awayWin: 0 });
    expect(o.homeWin).toBeCloseTo(1 / 3, 10);
  });
});

describe('argmaxOutcome', () => {
  it('picks the most likely label', () => {
    expect(argmaxOutcome({ homeWin: 0.5, draw: 0.3, awayWin: 0.2 })).toBe('home');
    expect(argmaxOutcome({ homeWin: 0.2, draw: 0.3, awayWin: 0.5 })).toBe('away');
    expect(argmaxOutcome({ homeWin: 0.2, draw: 0.6, awayWin: 0.2 })).toBe('draw');
  });
});
