import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Pitch dimensions (world units) — roughly real proportions (105 x 68). */
const PITCH_LENGTH = 124;
const PITCH_WIDTH = 80;

/** Camera flight: a broadcast glide straight down the length of the pitch. */
const CAM_HEIGHT = 17;
const LOOK_AHEAD = 38;
/** Behind the near goal at scroll 0; over the far goal at scroll 1. */
const CAM_Z_START = PITCH_LENGTH / 2 + LOOK_AHEAD;
const CAM_Z_END = -PITCH_LENGTH / 2 + LOOK_AHEAD;

/**
 * Paints a full football pitch on a canvas — mowed stripes down the length, plus
 * chalk markings: boundary, halfway line, centre circle/spot, both penalty and
 * goal boxes, penalty arcs and corner arcs. Mapped once onto the pitch plane.
 */
function makePitchTexture(): THREE.CanvasTexture {
  const wPx = 660;
  const lPx = 1024;
  const c = document.createElement('canvas');
  c.width = wPx;
  c.height = lPx;
  const ctx = c.getContext('2d')!;

  // Grass + mowed stripes running goal-to-goal.
  const stripes = 10;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#0f7a48' : '#0c6b3f';
    ctx.fillRect((i / stripes) * wPx, 0, wPx / stripes + 1, lPx);
  }

  ctx.strokeStyle = 'rgba(240,250,245,0.55)';
  ctx.fillStyle = 'rgba(240,250,245,0.6)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  const m = 38;
  const left = m;
  const right = wPx - m;
  const top = m;
  const bottom = lPx - m;
  const cx = wPx / 2;
  const cy = lPx / 2;

  // Boundary + halfway line.
  ctx.strokeRect(left, top, right - left, bottom - top);
  ctx.beginPath();
  ctx.moveTo(left, cy);
  ctx.lineTo(right, cy);
  ctx.stroke();

  // Centre circle + spot.
  const cr = wPx * 0.135;
  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
  ctx.fill();

  const penW = wPx * 0.62;
  const penH = lPx * 0.15;
  const goalW = wPx * 0.3;
  const goalH = lPx * 0.055;
  const arcR = wPx * 0.12;

  // Both ends: penalty box, goal box, penalty spot, penalty arc.
  for (const end of [top, bottom]) {
    const dir = end === top ? 1 : -1;
    ctx.strokeRect(cx - penW / 2, end === top ? top : bottom - penH, penW, penH);
    ctx.strokeRect(cx - goalW / 2, end === top ? top : bottom - goalH, goalW, goalH);
    const spotY = end + dir * penH * 0.72;
    ctx.beginPath();
    ctx.arc(cx, spotY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    if (dir === 1) ctx.arc(cx, spotY, arcR, 0.22 * Math.PI, 0.78 * Math.PI);
    else ctx.arc(cx, spotY, arcR, 1.22 * Math.PI, 1.78 * Math.PI);
    ctx.stroke();
  }

  // Corner arcs.
  const co = 16;
  ctx.beginPath();
  ctx.arc(left, top, co, 0, 0.5 * Math.PI);
  ctx.arc(right, top, co, 0.5 * Math.PI, Math.PI);
  ctx.arc(right, bottom, co, Math.PI, 1.5 * Math.PI);
  ctx.arc(left, bottom, co, 1.5 * Math.PI, 2 * Math.PI);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * The 3D football pitch behind the main tabs. The camera flies straight down the
 * length of the field as the page scrolls — scroll 0 sits behind one goal,
 * scroll 1 arrives at the other — so a full scroll always travels end to end,
 * whatever the page's height.
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
    const targetZ = CAM_Z_START + (CAM_Z_END - CAM_Z_START) * progress.current;
    cam.position.x = 0;
    cam.position.y = CAM_HEIGHT;
    cam.position.z += (targetZ - cam.position.z) * 0.07;
    cam.lookAt(0, 0, cam.position.z - LOOK_AHEAD);
  });

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <>
      <color attach="background" args={['#070b1c']} />
      <fog attach="fog" args={['#08151a', 46, 215]} />

      <ambientLight intensity={0.55} color="#d6f0e2" />
      <hemisphereLight color="#eafff2" groundColor="#0a3322" intensity={0.85} />
      <directionalLight position={[12, 24, 10]} intensity={1.6} color="#fff4da" />
      <directionalLight position={[-10, 12, -8]} intensity={0.45} color="#9fc8ff" />

      {/* Surrounding turf so the pitch never shows a hard edge. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[360, 440]} />
        <meshStandardMaterial color="#0b5a36" roughness={1} metalness={0} />
      </mesh>

      {/* The marked pitch. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[PITCH_WIDTH, PITCH_LENGTH]} />
        <meshStandardMaterial map={texture} roughness={0.92} metalness={0} />
      </mesh>
    </>
  );
}
