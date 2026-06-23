import { useMemo } from 'react';
import { Stage } from './Stage';
import { Jersey } from './Jersey';
import { makePitchTexture } from './pitchTexture';
import type { Team } from '@/types/domain';

interface JerseySceneProps {
  home: Team | undefined;
  away: Team | undefined;
}

/** Match-detail banner: a 3D pitch with the two teams' jerseys floating above. */
export function JerseyScene({ home, away }: JerseySceneProps) {
  const pitch = useMemo(() => makePitchTexture(), []);

  return (
    <Stage
      cameraPosition={[0, 0.6, 4.2]}
      fov={45}
      orbit={{
        autoRotate: true,
        autoRotateSpeed: 0.5,
        enableZoom: false,
        enablePan: false,
        minPolarAngle: Math.PI * 0.32,
        maxPolarAngle: Math.PI * 0.55,
      }}
    >
      {/* Pitch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]} receiveShadow>
        <planeGeometry args={[7, 5]} />
        <meshStandardMaterial map={pitch} roughness={0.95} />
      </mesh>

      <Jersey
        primary={home?.colors.primary ?? '#46876a'}
        secondary={home?.colors.secondary ?? '#d4a437'}
        number="10"
        position={[-1.15, 0.1, 0]}
        spin={0.35}
      />
      <Jersey
        primary={away?.colors.primary ?? '#cfcabb'}
        secondary={away?.colors.secondary ?? '#0a2e1f'}
        number="9"
        position={[1.15, 0.1, 0]}
        spin={-0.3}
      />
    </Stage>
  );
}
