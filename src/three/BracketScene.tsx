import { Stage } from './Stage';
import { Bracket3D } from './Bracket3D';

/** Camera + gentle orbit for the 3D tournament tree. */
export function BracketScene() {
  return (
    <Stage
      cameraPosition={[0, 0.5, 14]}
      fov={42}
      orbit={{
        autoRotate: true,
        autoRotateSpeed: 0.28,
        enableZoom: true,
        enablePan: true,
        minDistance: 6,
        maxDistance: 24,
        minPolarAngle: Math.PI * 0.28,
        maxPolarAngle: Math.PI * 0.62,
        minAzimuthAngle: -0.7,
        maxAzimuthAngle: 0.7,
      }}
    >
      <Bracket3D />
    </Stage>
  );
}
