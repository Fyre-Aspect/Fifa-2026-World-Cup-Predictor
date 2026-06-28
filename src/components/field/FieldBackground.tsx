import { lazy, Suspense } from 'react';
import { useStore } from '@/store/useStore';
import { PitchField } from '@/components/teams/PitchField';

// Code-split the 3D scene so phones (CSS fallback) never download three.js.
const PitchFieldScene = lazy(() =>
  import('@/three/PitchFieldScene').then((m) => ({ default: m.PitchFieldScene })),
);

/**
 * The shared pitch behind the main tabs. On capable screens it's a 3D field the
 * camera glides down as you scroll; on low-power devices (and while the scene
 * loads) it degrades to the lightweight CSS pitch. Fixed to the viewport and
 * non-interactive, so content scrolls over it like a stadium camera move.
 */
export function FieldBackground() {
  const lowPower = useStore((s) => s.lowPower);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {lowPower ? (
        <PitchField />
      ) : (
        <Suspense fallback={<PitchField />}>
          <PitchFieldScene />
        </Suspense>
      )}
      {/* Readability scrim: a gentle dark wash, heavier at the top where the page
          headers sit, so text stays legible over the bright grass. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(6,10,24,0.55) 0%, rgba(6,10,24,0.32) 22%, rgba(6,10,24,0.28) 100%)',
        }}
      />
    </div>
  );
}
