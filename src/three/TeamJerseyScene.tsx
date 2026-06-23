import { Stage } from './Stage';
import { Jersey } from './Jersey';
import type { Team } from '@/types/domain';

/** A single slowly-rotating jersey in the team's colors for the team page. */
export function TeamJerseyScene({ team }: { team: Team | undefined }) {
  return (
    <Stage
      cameraPosition={[0, 0.2, 3.4]}
      fov={45}
      orbit={{
        autoRotate: true,
        autoRotateSpeed: 0.8,
        enableZoom: false,
        enablePan: false,
        minPolarAngle: Math.PI * 0.3,
        maxPolarAngle: Math.PI * 0.6,
      }}
    >
      <Jersey
        primary={team?.colors.primary ?? '#46876a'}
        secondary={team?.colors.secondary ?? '#d4a437'}
        number="10"
        position={[0, 0, 0]}
        spin={0.4}
      />
    </Stage>
  );
}
