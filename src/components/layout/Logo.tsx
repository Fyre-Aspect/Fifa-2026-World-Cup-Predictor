import { Link } from 'react-router-dom';

/** Wordmark + minimal pitch-circle glyph. */
export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="GroupStage home">
      <span className="relative grid h-8 w-8 place-items-center">
        <svg viewBox="0 0 32 32" className="h-8 w-8">
          <circle
            cx="16"
            cy="16"
            r="10"
            fill="none"
            stroke="#d4a437"
            strokeWidth="1.5"
            className="transition-all duration-300 group-hover:stroke-gold-200"
          />
          <path d="M16 6 L16 26 M6 16 L26 16" stroke="#d4a437" strokeWidth="0.75" opacity="0.45" />
          <circle cx="16" cy="16" r="2.6" fill="#d4a437" />
        </svg>
      </span>
      <span className="font-display text-xl font-600 tracking-tight text-offwhite">
        Group<span className="text-gold-400">Stage</span>
      </span>
    </Link>
  );
}
