/**
 * Small inline SVG glyphs used in place of emoji, so they inherit text colour,
 * scale crisply, and stay on-theme. No emoji anywhere in the UI.
 */

export function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h2.5a1.5 1.5 0 0 1 0 5H16.5M7 5H4.5a1.5 1.5 0 0 0 0 5H7.5" />
      <path d="M12 14v3M9 20.5h6M9.5 20.5c0-1.6.8-2.3 2.5-2.3s2.5.7 2.5 2.3" />
    </svg>
  );
}

/**
 * Original gold championship trophy emblem (a star over a cup on a plinth). Used
 * beside the projected champion. Deliberately not the FIFA trademark — the site
 * disclaims any FIFA affiliation; swap in a licensed asset if you hold rights.
 */
export function WorldCupEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="wc-emblem-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f9e7b6" />
          <stop offset="0.5" stopColor="#f0b429" />
          <stop offset="1" stopColor="#a5740f" />
        </linearGradient>
      </defs>
      <g fill="url(#wc-emblem-gold)">
        <path d="M24 3.5l1.7 4.1 4.4.3-3.4 2.9 1.1 4.3L24 12.8l-3.9 2.3 1.1-4.3-3.4-2.9 4.4-.3z" />
        <path d="M15.5 15.5h17v3.2a8.5 8.5 0 0 1-17 0v-3.2z" />
        <path d="M32.5 16.5H36a2.6 2.6 0 0 1 0 5.2h-4.2v-2h4.2a.6.6 0 0 0 0-1.2h-3.5zM15.5 16.5H12a2.6 2.6 0 0 0 0 5.2h4.2v-2H12a.6.6 0 0 1 0-1.2h3.5z" />
        <rect x="22.4" y="25.4" width="3.2" height="6.2" />
        <path d="M17.5 33.5h13l-1.4 3.6h-10.2z" />
        <rect x="15.5" y="37.5" width="17" height="2.8" rx="1.4" />
      </g>
    </svg>
  );
}

export function BallIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.4l3.3 2.4-1.25 3.9H9.95L8.7 9.8 12 7.4Z" />
      <path d="M12 3v4.4M4.3 9.4l3.7.7M19.7 9.4l-3.7.7M7 18.3l1.9-3.1M17 18.3l-1.9-3.1" />
    </svg>
  );
}
