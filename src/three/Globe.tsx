import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { HostCity } from '@/types/domain';
import { latLonToVector3 } from './geo';
import { useImageTexture } from './useImageTexture';
import { CityPin } from './CityPin';

const GLOBE_RADIUS = 2;
/** NASA Blue Marble (public domain), served from the three-globe example assets. */
const EARTH_TEXTURE_URL = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';

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
  const earthTexture = useImageTexture(EARTH_TEXTURE_URL);

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

      {/* Earth */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        {earthTexture ? (
          <meshStandardMaterial map={earthTexture} roughness={0.85} metalness={0.05} />
        ) : (
          <meshStandardMaterial color="#15543a" roughness={0.9} metalness={0.05} />
        )}
      </mesh>

      {/* Thin atmosphere shell */}
      <mesh scale={1.04}>
        <sphereGeometry args={[GLOBE_RADIUS, 48, 48]} />
        <meshBasicMaterial
          color="#4f9bd6"
          transparent
          opacity={0.08}
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
