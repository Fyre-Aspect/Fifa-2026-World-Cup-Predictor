import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { HostCity } from '@/types/domain';

interface CityPinProps {
  city: HostCity;
  position: THREE.Vector3;
  selected: boolean;
  onSelect: (id: string) => void;
}

/** A glowing host-city marker that sits on the globe surface. */
export function CityPin({ city, position, selected, onSelect }: CityPinProps) {
  const [hovered, setHovered] = useState(false);
  const haloRef = useRef<THREE.Mesh>(null);
  const active = hovered || selected;

  useFrame((state) => {
    if (!haloRef.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.12;
    const base = active ? 2.6 : 1.7;
    haloRef.current.scale.setScalar(base * pulse);
  });

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(city.id);
      }}
    >
      {/* Core */}
      <mesh>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial
          color="#f3d479"
          emissive="#d4a437"
          emissiveIntensity={active ? 2.6 : 1.4}
          toneMapped={false}
        />
      </mesh>
      {/* Soft halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial
          color="#d4a437"
          transparent
          opacity={active ? 0.3 : 0.16}
          depthWrite={false}
        />
      </mesh>

      {active && (
        <Html
          center
          distanceFactor={6}
          position={[0, 0.16, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="whitespace-nowrap rounded-md border border-gold-400/40 bg-pitch-950/90 px-2 py-1 text-center shadow-glow-sm backdrop-blur-sm">
            <div className="font-display text-xs font-600 tracking-wide text-offwhite">
              {city.name}
            </div>
            <div className="text-[9px] text-offwhite-faint">{city.venue}</div>
          </div>
        </Html>
      )}
    </group>
  );
}
