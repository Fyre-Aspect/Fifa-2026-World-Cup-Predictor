import { describe, it, expect } from 'vitest';
import { buildMockBracket } from '@/data/mockBracket';
import { MOCK_TEAMS_BY_ID } from '@/data/mockTeams';
import { ELO_SEED } from '@/model/eloSeed';
import type { Match } from '@/types/domain';
import { projectedR32Matches } from './projectedBracket';
import { projectKnockouts } from './knockout';

const WEIGHTS = { elo: 0.4, form: 0.2, squad: 0.2, polymarket: 0.1, books: 0.1 };

/**
 * The projected bracket must follow the official FIFA 2026 skeleton: fixed
 * group-position pairings in the Round of 32 (matches 73–88) and the real tree
 * up to the final — not a generic strength seed.
 */
const OFFICIAL_R32 = [
  ['2A', '2B'], ['1E', '3'], ['1F', '2C'], ['1C', '2F'],
  ['1I', '3'], ['2E', '2I'], ['1A', '3'], ['1L', '3'],
  ['1D', '3'], ['1G', '3'], ['2K', '2L'], ['1H', '2J'],
  ['1B', '3'], ['1J', '2H'], ['1K', '3'], ['2D', '2G'],
] as const;

describe('projectedR32Matches — official 2026 skeleton', () => {
  const matches = buildMockBracket();
  const r32 = projectedR32Matches(matches, MOCK_TEAMS_BY_ID, ELO_SEED);

  it('seeds 16 Round-of-32 matches with 32 distinct teams', () => {
    expect(r32).toHaveLength(16);
    const ids = new Set(r32.flatMap((m) => [m.homeTeamId, m.awayTeamId]));
    expect(ids.size).toBe(32);
  });

  it('places each fixed slot in the right group, in canonical match order', () => {
    const groupOf = (id: string | null) => (id ? MOCK_TEAMS_BY_ID[id]?.group : undefined);
    r32.forEach((m, i) => {
      const [homeCode, awayCode] = OFFICIAL_R32[i];
      const host = homeCode.slice(1); // every home slot here is a fixed winner/runner
      expect(groupOf(m.homeTeamId)).toBe(host);
      if (awayCode === '3') {
        // A third-placed team is never drawn against its own group's winner.
        expect(groupOf(m.awayTeamId)).not.toBe(host);
      } else {
        expect(groupOf(m.awayTeamId)).toBe(awayCode.slice(1));
      }
    });
  });

  it('never pits two teams from the same group against each other', () => {
    for (const m of r32) {
      expect(MOCK_TEAMS_BY_ID[m.homeTeamId!]?.group).not.toBe(
        MOCK_TEAMS_BY_ID[m.awayTeamId!]?.group,
      );
    }
  });
});

describe('projectKnockouts — official tree to a champion', () => {
  const matches = buildMockBracket();
  const proj = projectKnockouts(matches, MOCK_TEAMS_BY_ID, ELO_SEED, WEIGHTS, {});

  it('fills every round of the bracket and crowns a champion', () => {
    expect(proj.round32).toHaveLength(16);
    expect(proj.round16).toHaveLength(8);
    expect(proj.quarter).toHaveLength(4);
    expect(proj.semi).toHaveLength(2);
    expect(proj.final).not.toBeNull();
    expect(proj.championId).toBeTruthy();
  });

  it('advances a winner through every projected tie (no TBD gaps)', () => {
    for (const tie of [...proj.round16, ...proj.quarter, ...proj.semi]) {
      expect(tie.homeId).toBeTruthy();
      expect(tie.awayId).toBeTruthy();
      expect(tie.winnerId === tie.homeId || tie.winnerId === tie.awayId).toBe(true);
    }
    // The champion is the winner of the final.
    expect(proj.championId).toBe(proj.final?.winnerId);
  });
});

describe('projectKnockouts — real results drive the bracket', () => {
  // Two group teams whose runner-up/winner slots pair them in canonical R32
  // slot 73 (2A v 2B). We take the mock, seed the actual qualifiers into a real
  // finished R32 fixture, and check the loser is eliminated — not advanced.
  const base = buildMockBracket();
  const seeded = projectedR32Matches(base, MOCK_TEAMS_BY_ID, ELO_SEED);
  const slot73 = seeded[0]; // ['2A','2B'] — both fixed, no third-place ambiguity
  const home = slot73.homeTeamId!;
  const away = slot73.awayTeamId!;

  // A real, finished R32 result where the AWAY side wins on penalties (reg 1-1).
  const played: Match = {
    ...slot73,
    id: 'REAL-73',
    status: 'finished',
    score: { home: 1, away: 1 },
    winner: 'away',
    aet: true,
    penalties: { home: 3, away: 4 },
  };
  const matches = [...base.filter((m) => m.stage !== 'round32'), played, ...seeded.slice(1)];
  const proj = projectKnockouts(matches, MOCK_TEAMS_BY_ID, ELO_SEED, WEIGHTS, {});

  it('shows the real score, penalties and the side that actually advanced', () => {
    const tie = proj.round32.find((t) => t.homeId === home || t.awayId === home)!;
    expect(tie.played).toBe(true);
    expect(tie.winnerId).toBe(away); // the real winner, not the model's pick
    expect(tie.penalties).toEqual({ home: 3, away: 4 });
    expect(tie.scoreline).toMatchObject({ home: 1, away: 1 });
  });

  it('never advances the team that lost its real tie', () => {
    const later = [...proj.round16, ...proj.quarter, ...proj.semi, proj.final!]
      .flatMap((t) => [t.homeId, t.awayId]);
    expect(later).not.toContain(home); // the eliminated side appears nowhere downstream
  });
});
