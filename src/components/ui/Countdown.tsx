import { useEffect, useState } from 'react';
import { TOURNAMENT, tournamentPhase } from '@/data/tournament';

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function diff(target: number, now: number): Parts {
  const ms = Math.max(0, target - now);
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/**
 * Counts down to the opening match before the tournament, to the final while
 * it's underway, and shows a finished state afterwards.
 */
export function Countdown() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const phase = tournamentPhase(new Date(now));
  const target =
    phase === 'pre' ? Date.parse(TOURNAMENT.start) : Date.parse(TOURNAMENT.final);
  const parts = diff(target, now);

  const label =
    phase === 'pre'
      ? 'Kickoff in'
      : phase === 'live'
        ? 'Final in'
        : 'Tournament complete';

  if (phase === 'post') {
    return (
      <div className="text-sm font-500 uppercase tracking-widest text-gold-300">
        {label}
      </div>
    );
  }

  const units: Array<[string, number]> = [
    ['Days', parts.days],
    ['Hrs', parts.hours],
    ['Min', parts.minutes],
    ['Sec', parts.seconds],
  ];

  return (
    <div>
      <div className="mb-2 text-xs font-500 uppercase tracking-widest text-offwhite-faint">
        {label}
      </div>
      <div className="flex items-end gap-3">
        {units.map(([unit, value]) => (
          <div key={unit} className="flex flex-col items-center">
            <span className="display-num text-4xl font-700 leading-none text-offwhite sm:text-5xl">
              {String(value).padStart(2, '0')}
            </span>
            <span className="mt-1 text-[10px] font-500 uppercase tracking-wider text-offwhite-faint">
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
