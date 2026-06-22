import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/cn';

/**
 * 2D stand-in for the globe on small / low-power devices. A decorative rotating
 * graticule plus a grid of selectable host-city chips, which drive the same
 * CitySchedulePanel as the 3D pins.
 */
export function GlobeFallback2D() {
  const cities = useStore((s) => s.cities);
  const selectedCityId = useStore((s) => s.selectedCityId);
  const selectCity = useStore((s) => s.selectCity);

  return (
    <div className="flex h-full flex-col items-center gap-4 p-4">
      <div className="relative aspect-square w-40 shrink-0">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#1a4733_0%,#0a2e1f_45%,#04150f_100%)]" />
        <motion.svg
          viewBox="0 0 200 200"
          className="absolute inset-0 h-full w-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 90, ease: 'linear', repeat: Infinity }}
          aria-hidden="true"
        >
          {[20, 40, 60, 80].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgba(70,135,106,0.35)" strokeWidth="0.6" />
          ))}
          {[...Array(8)].map((_, i) => (
            <line
              key={i}
              x1="100"
              y1="8"
              x2="100"
              y2="192"
              stroke="rgba(70,135,106,0.25)"
              strokeWidth="0.6"
              transform={`rotate(${i * 22.5} 100 100)`}
            />
          ))}
        </motion.svg>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 overflow-y-auto">
        {cities.map((city) => (
          <button
            key={city.id}
            onClick={() => selectCity(city.id === selectedCityId ? null : city.id)}
            className={cn(
              'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
              city.id === selectedCityId
                ? 'border-gold-400/60 bg-gold-400/10 text-offwhite'
                : 'border-pitch-600/40 bg-pitch-800/50 text-offwhite-dim hover:text-offwhite',
            )}
          >
            <span className="block truncate font-500">{city.name}</span>
            <span className="block text-[11px] text-offwhite-faint">{city.country}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
