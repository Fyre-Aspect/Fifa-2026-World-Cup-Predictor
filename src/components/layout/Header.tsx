import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';

const NAV = [
  { to: '/', label: 'Globe', end: true },
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
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 border-t border-pitch-700/40 px-4 py-2 sm:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex-1 rounded-md px-3 py-1.5 text-center text-sm font-500 transition-colors',
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
