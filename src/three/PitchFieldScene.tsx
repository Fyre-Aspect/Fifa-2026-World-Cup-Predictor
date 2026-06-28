import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import { PitchField3D } from './PitchField3D';

/**
 * Canvas wrapper for the 3D pitch background. Lazy-loaded so the heavy three.js
 * bundle only downloads on devices that actually render it (phones fall back to
 * the CSS pitch). No OrbitControls — the only camera motion is the scroll glide.
 */
export function PitchFieldScene() {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0, 3.4, 12], fov: 58, near: 0.1, far: 400 }}
    >
      <PitchField3D />
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
