import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

interface JerseyProps {
  primary: string;
  secondary: string;
  number: string;
  position: [number, number, number];
  spin?: number;
}

/**
 * A procedurally-built low-poly football shirt in the team colors. No external
 * GLTF — just a torso, two sleeves, a collar, a chest stripe, and a number.
 */
export function Jersey({ primary, secondary, number, position, spin = 0.3 }: JerseyProps) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * spin;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.4}>
      <group ref={group} position={position}>
        {/* Torso */}
        <RoundedBox args={[0.95, 1.15, 0.28]} radius={0.12} smoothness={4}>
          <meshStandardMaterial color={primary} roughness={0.6} metalness={0.05} />
        </RoundedBox>

        {/* Sleeves */}
        <mesh position={[-0.66, 0.32, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.42, 0.34, 0.26]} />
          <meshStandardMaterial color={primary} roughness={0.6} />
        </mesh>
        <mesh position={[0.66, 0.32, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.42, 0.34, 0.26]} />
          <meshStandardMaterial color={primary} roughness={0.6} />
        </mesh>

        {/* Sleeve cuffs */}
        <mesh position={[-0.84, 0.18, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.12, 0.36, 0.28]} />
          <meshStandardMaterial color={secondary} roughness={0.6} />
        </mesh>
        <mesh position={[0.84, 0.18, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.12, 0.36, 0.28]} />
          <meshStandardMaterial color={secondary} roughness={0.6} />
        </mesh>

        {/* Chest stripe */}
        <mesh position={[0, 0.05, 0.145]}>
          <boxGeometry args={[0.96, 0.18, 0.02]} />
          <meshStandardMaterial color={secondary} roughness={0.5} />
        </mesh>

        {/* Collar */}
        <mesh position={[0, 0.62, 0.05]}>
          <boxGeometry args={[0.4, 0.12, 0.3]} />
          <meshStandardMaterial color={secondary} roughness={0.6} />
        </mesh>

        {/* Number */}
        <Text position={[0, -0.18, 0.16]} fontSize={0.34} color={secondary} anchorX="center" anchorY="middle">
          {number}
        </Text>
      </group>
    </Float>
  );
}
