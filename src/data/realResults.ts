/**
 * Real 2026 World Cup group-stage results, fetched from public reporting and
 * keyed by the two teams involved (order-independent). This replaces the old
 * model-synthesised "results" so the app shows actual scores instead of guesses.
 *
 * IMPORTANT: this is a manually captured SNAPSHOT as of ~23 June 2026 and does
 * not live-update. Portugal v Uzbekistan is in progress here (4–0) but a real
 * feed would move; matches without an entry are shown as upcoming (with model
 * predictions), never invented. For true live data, wire the football API in
 * src/api/football.ts with an API key.
 *
 * Sources: FIFA, ESPN, NBC Sports, Al Jazeera, Yahoo Sports match reports
 * (June 2026). See the assistant's message for links.
 */

export const RESULTS_AS_OF = '2026-06-23';

export interface RealEvent {
  minute: number;
  /** Team credited (scorer's side); null for neutral notes. */
  teamId: string | null;
  type: 'goal' | 'owngoal' | 'info';
  text: string;
}

export interface RealResult {
  /** The two teams, in any order; lookups are order-independent. */
  teams: [string, string];
  /** Goals for teams[0] and teams[1] respectively. */
  goals: [number, number];
  status: 'finished' | 'live';
  /** Live clock for in-progress matches. */
  minute?: number;
  /** Optional notable events for the commentary feed. */
  events?: RealEvent[];
}

export const REAL_RESULTS: RealResult[] = [
  // ---- Group A ----
  { teams: ['MEX', 'RSA'], goals: [2, 0], status: 'finished' },
  { teams: ['KOR', 'CZE'], goals: [2, 1], status: 'finished' },
  { teams: ['CZE', 'RSA'], goals: [1, 1], status: 'finished' },
  { teams: ['MEX', 'KOR'], goals: [1, 0], status: 'finished' },
  // ---- Group B ----
  { teams: ['QAT', 'SUI'], goals: [1, 1], status: 'finished' },
  { teams: ['SUI', 'BIH'], goals: [4, 1], status: 'finished' },
  { teams: ['CAN', 'QAT'], goals: [6, 0], status: 'finished' },
  // ---- Group C ----
  { teams: ['BRA', 'MAR'], goals: [1, 1], status: 'finished' },
  { teams: ['SCO', 'HAI'], goals: [1, 0], status: 'finished' },
  { teams: ['BRA', 'HAI'], goals: [3, 0], status: 'finished' },
  { teams: ['MAR', 'SCO'], goals: [1, 0], status: 'finished' },
  // ---- Group D ----
  { teams: ['AUS', 'TUR'], goals: [2, 0], status: 'finished' },
  { teams: ['USA', 'AUS'], goals: [2, 0], status: 'finished' },
  { teams: ['PAR', 'TUR'], goals: [1, 0], status: 'finished' },
  // ---- Group E ----
  { teams: ['GER', 'CUW'], goals: [7, 1], status: 'finished' },
  { teams: ['CIV', 'ECU'], goals: [1, 0], status: 'finished' },
  { teams: ['GER', 'CIV'], goals: [2, 1], status: 'finished' },
  { teams: ['ECU', 'CUW'], goals: [0, 0], status: 'finished' },
  // ---- Group F ----
  { teams: ['NED', 'JPN'], goals: [2, 2], status: 'finished' },
  { teams: ['SWE', 'TUN'], goals: [5, 1], status: 'finished' },
  { teams: ['NED', 'SWE'], goals: [5, 1], status: 'finished' },
  { teams: ['JPN', 'TUN'], goals: [4, 0], status: 'finished' },
  // ---- Group G ----
  { teams: ['BEL', 'EGY'], goals: [1, 1], status: 'finished' },
  { teams: ['IRN', 'NZL'], goals: [2, 2], status: 'finished' },
  { teams: ['BEL', 'IRN'], goals: [0, 0], status: 'finished' },
  { teams: ['EGY', 'NZL'], goals: [3, 1], status: 'finished' },
  // ---- Group H ----
  { teams: ['ESP', 'CPV'], goals: [0, 0], status: 'finished' },
  { teams: ['KSA', 'URU'], goals: [1, 1], status: 'finished' },
  { teams: ['ESP', 'KSA'], goals: [4, 0], status: 'finished' },
  { teams: ['URU', 'CPV'], goals: [2, 2], status: 'finished' },
  // ---- Group I ----
  { teams: ['FRA', 'SEN'], goals: [3, 1], status: 'finished' },
  { teams: ['NOR', 'IRQ'], goals: [4, 1], status: 'finished' },
  // ---- Group J ----
  {
    teams: ['ARG', 'ALG'],
    goals: [3, 0],
    status: 'finished',
    events: [
      { minute: 17, teamId: 'ARG', type: 'goal', text: 'GOAL! Lionel Messi opens the scoring for Argentina.' },
      { minute: 60, teamId: 'ARG', type: 'goal', text: 'GOAL! Messi again — two for the captain.' },
      { minute: 76, teamId: 'ARG', type: 'goal', text: 'GOAL! Messi completes his first World Cup hat-trick, equalling the all-time record of 16 World Cup goals.' },
    ],
  },
  { teams: ['AUT', 'JOR'], goals: [3, 1], status: 'finished' },
  {
    teams: ['ARG', 'AUT'],
    goals: [2, 0],
    status: 'finished',
    events: [
      { minute: 35, teamId: 'ARG', type: 'goal', text: 'GOAL! Messi puts Argentina ahead against Austria.' },
      { minute: 70, teamId: 'ARG', type: 'goal', text: "GOAL! Messi's second seals it — both Argentina goals from the captain." },
    ],
  },
  // ---- Group K ----
  { teams: ['POR', 'COD'], goals: [1, 1], status: 'finished' },
  { teams: ['COL', 'UZB'], goals: [3, 1], status: 'finished' },
  {
    teams: ['POR', 'UZB'],
    goals: [4, 0],
    status: 'live',
    minute: 52,
    events: [
      { minute: 6, teamId: 'POR', type: 'goal', text: 'GOAL! Cristiano Ronaldo strikes in the 6th minute — his first of the tournament, becoming the first player to score at six different World Cups.' },
      { minute: 33, teamId: 'POR', type: 'goal', text: 'GOAL! Ronaldo again, his second of the night — Portugal double the lead.' },
      { minute: 41, teamId: 'POR', type: 'goal', text: 'GOAL! Nuno Mendes lashes one into the left corner. 3–0 Portugal.' },
      { minute: 46, teamId: 'POR', type: 'owngoal', text: "GOAL! João Félix's back-flick is turned in off an Uzbekistan defender — an own goal makes it 4–0." },
    ],
  },
  // ---- Group L ----
  { teams: ['ENG', 'CRO'], goals: [4, 2], status: 'finished' },
  { teams: ['GHA', 'PAN'], goals: [1, 0], status: 'finished' },
];

const index = new Map<string, RealResult>();
for (const r of REAL_RESULTS) {
  index.set([...r.teams].sort().join('|'), r);
}

export interface OrientedResult {
  home: number;
  away: number;
  status: 'finished' | 'live';
  minute: number | null;
  events?: RealEvent[];
}

/** Look up a real result for a fixture, oriented to (home, away). */
export function realResultFor(home: string | null, away: string | null): OrientedResult | null {
  if (!home || !away) return null;
  const r = index.get([home, away].sort().join('|'));
  if (!r) return null;
  const homeFirst = r.teams[0] === home;
  return {
    home: homeFirst ? r.goals[0] : r.goals[1],
    away: homeFirst ? r.goals[1] : r.goals[0],
    status: r.status,
    minute: r.minute ?? null,
    events: r.events,
  };
}

/** Real notable events for a fixture's commentary feed, if captured. */
export function realEventsFor(home: string | null, away: string | null): RealEvent[] | null {
  if (!home || !away) return null;
  return index.get([home, away].sort().join('|'))?.events ?? null;
}
