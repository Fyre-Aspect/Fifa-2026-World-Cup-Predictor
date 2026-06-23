import type { Match } from '@/types/domain';

/**
 * Synthetic live commentary. The sample data has no real feed, so this generates
 * a deterministic minute-by-minute timeline for a match — kick-off, chances,
 * saves, cards and the goals that make up the scoreline — seeded from the match
 * id so it's stable across renders and simply reveals more as the clock ticks.
 *
 * Goals are pinned to never claim a minute in the future, so the feed always
 * agrees with the score shown in the header.
 */

export type CommentaryType =
  | 'kickoff'
  | 'goal'
  | 'chance'
  | 'save'
  | 'corner'
  | 'card'
  | 'sub'
  | 'info'
  | 'halftime'
  | 'fulltime';

export interface CommentaryEvent {
  id: string;
  minute: number;
  type: CommentaryType;
  side: 'home' | 'away' | 'neutral';
  text: string;
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32) so commentary is stable per match. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rand: () => number, arr: T[]): T => arr[Math.floor(rand() * arr.length)];

const GOAL_LINES = [
  (t: string) => `GOAL! ${t} find the net — a clinical finish.`,
  (t: string) => `GOAL for ${t}! The keeper had no chance with that one.`,
  (t: string) => `GOAL! ${t} break through and the bench erupts.`,
  (t: string) => `GOAL! A wonderful team move finished off by ${t}.`,
];
const CHANCE_LINES = [
  (t: string) => `${t} go close — the effort whistles just wide.`,
  (t: string) => `Big chance for ${t}, but it's dragged off target.`,
  (t: string) => `${t} work an opening and force a scramble in the box.`,
];
const SAVE_LINES = [
  (t: string) => `Superb save to deny ${t}! Fingertips onto the bar.`,
  (t: string) => `The ${t} keeper is equal to it — strong hands.`,
];
const CORNER_LINES = [(t: string) => `Corner to ${t}. They load the box.`];
const CARD_LINES = [
  (t: string) => `Yellow card for a ${t} player after a late challenge.`,
  (t: string) => `Booking for ${t} — the referee has a word.`,
];
const SUB_LINES = [(t: string) => `${t} make a change, fresh legs for the closing stages.`];
const INFO_LINES = [
  () => `A spell of patient possession, both sides probing.`,
  () => `The tempo lifts as the crowd gets behind both teams.`,
  () => `Physical contest in midfield, neither side giving an inch.`,
];

function sideName(side: 'home' | 'away', homeName: string, awayName: string): string {
  return side === 'home' ? homeName : awayName;
}

/**
 * The commentary visible for a match right now. Empty for matches that haven't
 * kicked off. Returned oldest-first; callers reverse for a newest-first feed.
 */
export function matchCommentary(match: Match, homeName: string, awayName: string): CommentaryEvent[] {
  if (match.status === 'scheduled') return [];

  const finished = match.status === 'finished';
  const now = finished ? 95 : Math.max(1, match.minute ?? 1);
  const rand = mulberry32(hashSeed(match.id));

  const homeGoals = match.score?.home ?? 0;
  const awayGoals = match.score?.away ?? 0;

  const events: CommentaryEvent[] = [];
  events.push({
    id: 'ko',
    minute: 0,
    type: 'kickoff',
    side: 'neutral',
    text: `We're under way — ${homeName} get the match started against ${awayName}.`,
  });

  // Goals: deterministic natural minutes, pinned to never exceed the clock.
  const goalSides: Array<'home' | 'away'> = [
    ...Array<'home'>(homeGoals).fill('home'),
    ...Array<'away'>(awayGoals).fill('away'),
  ];
  const usedMinutes = new Set<number>();
  goalSides.forEach((side, i) => {
    let natural = 3 + Math.floor(rand() * 84); // 3..86
    while (usedMinutes.has(natural)) natural = 3 + Math.floor(rand() * 84);
    usedMinutes.add(natural);
    const minute = finished ? natural : Math.min(natural, now);
    events.push({
      id: `goal-${i}`,
      minute,
      type: 'goal',
      side,
      text: pick(rand, GOAL_LINES)(sideName(side, homeName, awayName)),
    });
  });

  // Filler events sprinkled across the minutes already played.
  for (let m = 2; m <= Math.min(now, 90); m++) {
    if (usedMinutes.has(m) || rand() > 0.16) continue;
    usedMinutes.add(m);
    const side: 'home' | 'away' = rand() < 0.5 ? 'home' : 'away';
    const team = sideName(side, homeName, awayName);
    const roll = rand();
    let type: CommentaryType;
    let text: string;
    if (roll < 0.34) {
      type = 'chance';
      text = pick(rand, CHANCE_LINES)(team);
    } else if (roll < 0.56) {
      type = 'save';
      text = pick(rand, SAVE_LINES)(team);
    } else if (roll < 0.72) {
      type = 'corner';
      text = pick(rand, CORNER_LINES)(team);
    } else if (roll < 0.84) {
      type = 'card';
      text = pick(rand, CARD_LINES)(team);
    } else if (roll < 0.92) {
      type = 'sub';
      text = pick(rand, SUB_LINES)(team);
    } else {
      type = 'info';
      text = pick(rand, INFO_LINES)();
    }
    events.push({ id: `f-${m}`, minute: m, type, side: type === 'info' ? 'neutral' : side, text });
  }

  if (now >= 45) {
    events.push({ id: 'ht', minute: 45, type: 'halftime', side: 'neutral', text: 'Half-time whistle. The teams head in for a breather.' });
  }
  if (finished) {
    events.push({
      id: 'ft',
      minute: 90,
      type: 'fulltime',
      side: 'neutral',
      text: `Full time. It finishes ${homeName} ${homeGoals}–${awayGoals} ${awayName}.`,
    });
  }

  return events.sort((a, b) => a.minute - b.minute || a.id.localeCompare(b.id));
}

/** The single most recent commentary line — for compact live tickers. */
export function latestCommentaryLine(match: Match, homeName: string, awayName: string): string | null {
  const events = matchCommentary(match, homeName, awayName);
  return events.length > 0 ? events[events.length - 1].text : null;
}
