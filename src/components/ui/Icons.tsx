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
