import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { HostCity } from '@/types/domain';
import { latLonToVector3 } from './geo';
import { useImageTexture } from './useImageTexture';
import { CityPin } from './CityPin';

const GLOBE_RADIUS = 2;
/**
 * NASA Blue Marble + relief + ocean mask, bundled locally in /public/textures so
 * the Earth always renders (the old remote CDN texture frequently failed, which
 * left a flat coloured ball that didn't read as Earth at all).
 */
const EARTH_MAP_URL = '/textures/earth.jpg';
const EARTH_BUMP_URL = '/textures/earth-topology.png';
const EARTH_WATER_URL = '/textures/earth-water.png';

/** North America-ish center used as the resting orientation. */
const HOME = latLonToVector3(38, -97, 1);
const HOME_Y = -Math.atan2(HOME.x, HOME.z);

function targetRotationFor(city: HostCity): number {
  const p = latLonToVector3(city.lat, city.lon, 1);
  return -Math.atan2(p.x, p.z);
}

function shortestAngleLerp(current: number, target: number, t: number): number {
  let delta = (target - current) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * t;
}

interface GlobeProps {
  cities: HostCity[];
  selectedCityId: string | null;
  onSelectCity: (id: string) => void;
}

export function Globe({ cities, selectedCityId, onSelectCity }: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const earthMap = useImageTexture(EARTH_MAP_URL);
  // Bump + ocean mask are data maps — load them in linear space.
  const earthBump = useImageTexture(EARTH_BUMP_URL, THREE.NoColorSpace);
  const earthWater = useImageTexture(EARTH_WATER_URL, THREE.NoColorSpace);

  const pinData = useMemo(
    () =>
      cities.map((city) => ({
        city,
        position: latLonToVector3(city.lat, city.lon, GLOBE_RADIUS * 1.005),
      })),
    [cities],
  );

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId) ?? null,
    [cities, selectedCityId],
  );

  // Initialize resting orientation once.
  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    if (selectedCity) {
      // Ease the selected city to face the camera.
      g.rotation.y = shortestAngleLerp(g.rotation.y, targetRotationFor(selectedCity), 0.06);
    } else {
      // Slow idle spin.
      g.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, HOME_Y, 0.35]}>
      <Stars radius={60} depth={40} count={1800} factor={3} saturation={0} fade speed={0.4} />

      {/* Earth — Blue Marble colour, topographic relief, glinting oceans. */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        {earthMap ? (
          <meshStandardMaterial
            map={earthMap}
            bumpMap={earthBump ?? undefined}
            bumpScale={0.05}
            // Ocean mask is white over water → those areas pick up metalness and
            // reflect the rig, giving the seas a subtle specular glint vs matte land.
            metalnessMap={earthWater ?? undefined}
            metalness={earthWater ? 0.55 : 0.1}
            roughness={0.78}
          />
        ) : (
          // Fallback is now ocean-blue (not green) so it still reads as Earth.
          <meshStandardMaterial color="#1b3a6b" roughness={0.85} metalness={0.1} />
        )}
      </mesh>

      {/* Inner atmosphere — soft cyan rim on the back face. */}
      <mesh scale={1.035}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshBasicMaterial
          color="#3aa0ff"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      {/* Outer atmosphere — fainter, wider halo. */}
      <mesh scale={1.12}>
        <sphereGeometry args={[GLOBE_RADIUS, 48, 48]} />
        <meshBasicMaterial
          color="#6fc3ff"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {pinData.map(({ city, position }) => (
        <CityPin
          key={city.id}
          city={city}
          position={position}
          selected={city.id === selectedCityId}
          onSelect={onSelectCity}
        />
      ))}
    </group>
  );
}
