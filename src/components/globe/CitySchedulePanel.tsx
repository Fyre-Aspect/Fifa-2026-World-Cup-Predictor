import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { MatchRow } from '@/components/match/MatchRow';
import { matchesByCity } from '@/lib/tournament';

/**
 * Slides in when a host-city pin is selected on the globe, listing the matches
 * scheduled at that venue. This is the "fly to the city's matches" payoff.
 */
export function CitySchedulePanel() {
  const selectedCityId = useStore((s) => s.selectedCityId);
  const cities = useStore((s) => s.cities);
  const matches = useStore((s) => s.matches);
  const selectCity = useStore((s) => s.selectCity);

  const city = cities.find((c) => c.id === selectedCityId) ?? null;
  const cityMatches = city ? matchesByCity(matches, city.id) : [];

  return (
    <AnimatePresence>
      {city && (
        <motion.aside
          key={city.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="surface-raised pointer-events-auto absolute right-4 top-4 z-20 w-[min(20rem,calc(100%-2rem))] p-4"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-600 uppercase tracking-widest text-gold-300">
                {city.country}
              </p>
              <h3 className="font-display text-lg font-700 leading-tight text-offwhite">
                {city.name}
              </h3>
              <p className="text-xs text-offwhite-faint">{city.venue}</p>
            </div>
            <button
              onClick={() => selectCity(null)}
              className="interactive rounded-md border border-pitch-600/50 px-2 py-1 text-xs text-offwhite-dim hover:text-offwhite"
              aria-label="Close city panel"
            >
              ✕
            </button>
          </div>

          {cityMatches.length > 0 ? (
            <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
              {cityMatches.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-offwhite-dim">
              No matches loaded for this venue yet.
            </p>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
