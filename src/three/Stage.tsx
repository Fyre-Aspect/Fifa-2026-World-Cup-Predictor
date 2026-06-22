import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  AdaptiveDpr,
  AdaptiveEvents,
  Environment,
  Lightformer,
  OrbitControls,
  Preload,
} from '@react-three/drei';
import * as THREE from 'three';

interface OrbitConfig {
  enablePan?: boolean;
  enableZoom?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  minAzimuthAngle?: number;
  maxAzimuthAngle?: number;
  target?: [number, number, number];
}

interface StageProps {
  children: ReactNode;
  cameraPosition?: [number, number, number];
  fov?: number;
  orbit?: OrbitConfig | false;
  className?: string;
}

/**
 * Shared r3f canvas: one warm key light, one cool fill, soft ambient, and a
 * locally-generated environment map (no external HDR fetch) for subtle surface
 * depth. Used by both the globe and the bracket scenes.
 */
export function Stage({
  children,
  cameraPosition = [0, 0, 6],
  fov = 45,
  orbit = {},
  className,
}: StageProps) {
  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: cameraPosition, fov, near: 0.1, far: 100 }}
    >
      <color attach="background" args={['#04150f']} />
      <fog attach="fog" args={['#04150f', 14, 36]} />

      {/* Lighting: warm key + cool fill + soft ambient. */}
      <ambientLight intensity={0.45} color="#cfe6d8" />
      <directionalLight position={[6, 7, 5]} intensity={1.7} color="#fff2d8" />
      <directionalLight position={[-7, 2, -4]} intensity={0.55} color="#9fc0ff" />

      <Suspense fallback={null}>
        {/* Local environment — lightformers only, no remote HDR download. */}
        <Environment resolution={256} frames={1}>
          <Lightformer
            intensity={2.2}
            color="#fff2d8"
            position={[5, 5, -6]}
            scale={[12, 12, 1]}
          />
          <Lightformer
            intensity={1.1}
            color="#bcd4ff"
            position={[-6, 1, 6]}
            scale={[12, 12, 1]}
          />
          <Lightformer
            intensity={0.7}
            color="#d4a437"
            position={[0, -6, 0]}
            scale={[12, 4, 1]}
          />
        </Environment>

        {children}
        <Preload all />
      </Suspense>

      {orbit !== false && (
        <OrbitControls
          makeDefault
          enablePan={orbit.enablePan ?? false}
          enableZoom={orbit.enableZoom ?? true}
          autoRotate={orbit.autoRotate ?? false}
          autoRotateSpeed={orbit.autoRotateSpeed ?? 0.4}
          minDistance={orbit.minDistance ?? 3}
          maxDistance={orbit.maxDistance ?? 16}
          minPolarAngle={orbit.minPolarAngle ?? 0}
          maxPolarAngle={orbit.maxPolarAngle ?? Math.PI}
          minAzimuthAngle={orbit.minAzimuthAngle ?? -Infinity}
          maxAzimuthAngle={orbit.maxAzimuthAngle ?? Infinity}
          target={orbit.target ?? [0, 0, 0]}
          dampingFactor={0.08}
        />
      )}

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </Canvas>
  );
}
