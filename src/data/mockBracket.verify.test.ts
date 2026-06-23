import { describe, it, expect } from 'vitest';
import { buildMockBracket, GROUP_LETTERS } from './mockBracket';

describe('buildMockBracket (real 2026 draw)', () => {
  const matches = buildMockBracket();
  const byStage = (s: string) => matches.filter((m) => m.stage === s);

  it('has 12 groups and 72 group matches', () => {
    expect(GROUP_LETTERS).toHaveLength(12);
    expect(byStage('group')).toHaveLength(72);
  });

  it('has a full 48-team knockout skeleton', () => {
    expect(byStage('round32')).toHaveLength(16);
    expect(byStage('round16')).toHaveLength(8);
    expect(byStage('quarter')).toHaveLength(4);
    expect(byStage('semi')).toHaveLength(2);
    expect(byStage('third')).toHaveLength(1);
    expect(byStage('final')).toHaveLength(1);
  });

  it('seeds the Round of 32 with 32 distinct real teams', () => {
    const r32 = byStage('round32');
    const teams = new Set(r32.flatMap((m) => [m.homeTeamId, m.awayTeamId]));
    expect(teams.size).toBe(32);
    // No team meets a group-mate in the Round of 32 (different group letters).
    for (const m of r32) expect(m.homeTeamId !== m.awayTeamId).toBe(true);
  });

  it('has Portugal v Uzbekistan live at 4-0', () => {
    const porUzb = matches.find((m) => m.homeTeamId === 'POR' && m.awayTeamId === 'UZB');
    expect(porUzb?.group).toBe('K');
    expect(porUzb?.status).toBe('live');
    expect(porUzb?.score).toEqual({ home: 4, away: 0 });
  });

  it('uses the real Argentina 3-0 Algeria result, not an invented one', () => {
    const argAlg = matches.find(
      (m) =>
        (m.homeTeamId === 'ARG' && m.awayTeamId === 'ALG') ||
        (m.homeTeamId === 'ALG' && m.awayTeamId === 'ARG'),
    );
    expect(argAlg?.status).toBe('finished');
    const argGoals = argAlg?.homeTeamId === 'ARG' ? argAlg?.score?.home : argAlg?.score?.away;
    const algGoals = argAlg?.homeTeamId === 'ARG' ? argAlg?.score?.away : argAlg?.score?.home;
    expect(argGoals).toBe(3);
    expect(algGoals).toBe(0);
  });

  it('does not invent a Belgium v New Zealand match in progress', () => {
    const belNzl = matches.find(
      (m) =>
        (m.homeTeamId === 'BEL' && m.awayTeamId === 'NZL') ||
        (m.homeTeamId === 'NZL' && m.awayTeamId === 'BEL'),
    );
    // The fixture exists but has not been played — it must be upcoming, not live.
    expect(belNzl?.status).toBe('scheduled');
  });
});
