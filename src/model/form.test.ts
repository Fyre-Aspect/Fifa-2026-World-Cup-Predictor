import { describe, it, expect } from 'vitest';
import { buildFormTable } from './form';
import type { Match } from '@/types/domain';

function finished(id: string, home: string, away: string, hg: number, ag: number, day: number): Match {
  return {
    id,
    stage: 'group',
    group: 'A',
    kickoff: new Date(Date.parse('2026-06-01T00:00:00Z') + day * 86_400_000).toISOString(),
    cityId: 'nyc',
    homeTeamId: home,
    awayTeamId: away,
    status: 'finished',
    score: { home: hg, away: ag },
    minute: null,
  };
}

describe('buildFormTable', () => {
  it('ignores unfinished matches', () => {
    const scheduled: Match = { ...finished('m', 'AAA', 'BBB', 0, 0, 0), status: 'scheduled', score: null };
    expect(Object.keys(buildFormTable([scheduled]))).toHaveLength(0);
  });

  it('gives a perfect winner a high share and positive signal', () => {
    const table = buildFormTable([
      finished('m1', 'AAA', 'BBB', 3, 0, 1),
      finished('m2', 'AAA', 'CCC', 2, 0, 2),
    ]);
    expect(table.AAA.share).toBeCloseTo(1, 10);
    expect(table.AAA.signalElo).toBeGreaterThan(0);
    expect(table.AAA.games).toBe(2);
  });

  it('records the opponent loss as poor form', () => {
    const table = buildFormTable([finished('m1', 'AAA', 'BBB', 3, 0, 1)]);
    expect(table.BBB.share).toBeCloseTo(0, 10);
    expect(table.BBB.signalElo).toBeLessThan(0);
    expect(table.BBB.recent[0]).toBe('L');
  });

  it('weights recent results more heavily', () => {
    // Older win, recent loss → share below 0.5.
    const recencyDown = buildFormTable([
      finished('old', 'AAA', 'BBB', 3, 0, 1),
      finished('new', 'AAA', 'CCC', 0, 2, 9),
    ]);
    // Older loss, recent win → share above 0.5.
    const recencyUp = buildFormTable([
      finished('old', 'DDD', 'EEE', 0, 2, 1),
      finished('new', 'DDD', 'FFF', 2, 0, 9),
    ]);
    expect(recencyDown.AAA.share).toBeLessThan(0.5);
    expect(recencyUp.DDD.share).toBeGreaterThan(0.5);
  });

  it('caps the window to the most recent N games', () => {
    const games: Match[] = Array.from({ length: 14 }, (_, i) =>
      finished(`g${i}`, 'AAA', 'OPP', 1, 0, i + 1),
    );
    expect(buildFormTable(games, 10).AAA.games).toBe(10);
  });
});
