import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Where the camera sits at the top of the page, and how far it travels by the
 *  bottom — i.e. how far "down the pitch" a full scroll takes you. */
const START_Z = 12;
const TRAVEL = 150;
const LOOK_AHEAD = 16;
const LOOK_Y = -1.6;

/**
 * Builds the grass texture on a canvas: mowed stripes running down the pitch,
 * white touchlines down both sides, and a crossing line at the tile seam so the
 * field reads as evenly spaced yard lines when repeated along its length.
 */
function makePitchTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  const stripes = 8;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#0c5a39' : '#0a4d31';
    ctx.fillRect((i / stripes) * size, 0, size / stripes + 1, size);
  }

  ctx.strokeStyle = 'rgba(233,245,255,0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(size, 1);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(233,245,255,0.34)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(2, size);
  ctx.moveTo(size - 2, 0);
  ctx.lineTo(size - 2, size);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 26);
  tex.anisotropy = 8;
  return tex;
}

/**
 * The 3D football pitch that fills the page background. The camera looks down
 * the field and dollies forward as the user scrolls, so the page reads as a
 * glide down the pitch. Purely decorative — no interaction, no controls.
 */
export function PitchField3D() {
  const texture = useMemo(makePitchTexture, []);
  const progress = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useFrame((state) => {
    const cam = state.camera;
    const targetZ = START_Z - progress.current * TRAVEL;
    cam.position.z += (targetZ - cam.position.z) * 0.06;
    cam.lookAt(0, LOOK_Y, cam.position.z - LOOK_AHEAD);
  });

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <>
      <color attach="background" args={['#070b1c']} />
      <fog attach="fog" args={['#070b1c', 26, 200]} />

      <ambientLight intensity={0.5} color="#cfe6d8" />
      <hemisphereLight color="#dff3e6" groundColor="#0a2a1e" intensity={0.7} />
      <directionalLight position={[10, 20, 8]} intensity={1.5} color="#fff3d8" />
      <directionalLight position={[-8, 10, -6]} intensity={0.4} color="#9fc0ff" />

      {/* The pitch. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -260]}>
        <planeGeometry args={[100, 680]} />
        <meshStandardMaterial map={texture} roughness={0.96} metalness={0} />
      </mesh>

      {/* Centre circle + spot, lying on the grass near the top of the scroll. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -22]}>
        <ringGeometry args={[7.5, 7.85, 72]} />
        <meshBasicMaterial color="#e9f5ff" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -22]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#e9f5ff" transparent opacity={0.22} />
      </mesh>
    </>
  );
}
