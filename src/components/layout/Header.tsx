import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useStore } from '@/store/useStore';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';

const NAV = [
  { to: '/', label: 'Globe', end: true },
  { to: '/groups', label: 'Groups', end: false },
  { to: '/knockouts', label: 'Knockouts', end: false },
  { to: '/bracket', label: 'Bracket', end: false },
  { to: '/model', label: 'Model', end: false },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-pitch-600/40 bg-pitch-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'relative rounded-md px-3 py-1.5 text-sm font-500 transition-colors',
                    isActive
                      ? 'text-offwhite'
                      : 'text-offwhite-dim hover:text-offwhite',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gold-400 shadow-glow-sm"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <HonestyBadge />
          <NotificationBell />
          <DebugToggle />
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-pitch-700/40 px-4 py-2 sm:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-center text-sm font-500 transition-colors',
                isActive
                  ? 'bg-pitch-700/60 text-offwhite'
                  : 'text-offwhite-dim',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

/** Opens the model weight tuning panel. */
function DebugToggle() {
  const toggle = useStore((s) => s.toggleDebug);
  const open = useStore((s) => s.debugOpen);
  return (
    <button
      onClick={toggle}
      title="Tune model weights"
      aria-label="Tune model weights"
      className={cn(
        'interactive grid h-9 w-9 place-items-center rounded-lg border transition-colors',
        open
          ? 'border-gold-400/50 bg-gold-400/10 text-gold-300'
          : 'border-pitch-600/50 bg-pitch-800/60 text-offwhite-dim hover:text-offwhite',
      )}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" strokeLinecap="round" />
        <circle cx="16" cy="7" r="2.2" />
        <circle cx="8" cy="17" r="2.2" />
      </svg>
    </button>
  );
}

/** Persistent reminder that everything here is model output, not fact. */
function HonestyBadge() {
  return (
    <span
      className="hidden items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/5 px-3 py-1 text-[11px] font-500 uppercase tracking-wide text-gold-300 sm:inline-flex"
      title="Every number on this site is a model estimate with uncertainty, not a fact."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
      Model output, not fact
    </span>
  );
}
