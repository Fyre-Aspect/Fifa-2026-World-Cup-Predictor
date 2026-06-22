import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Match, MatchPrediction, Team } from '@/types/domain';
import { STAGE_LABEL, formatKickoffDate } from '@/lib/tournament';

const CARD_W = 1.5;
const CARD_H = 0.92;
const CARD_D = 0.07;

interface MatchCard3DProps {
  match: Match;
  home: Team | undefined;
  away: Team | undefined;
  prediction: MatchPrediction | undefined;
  position: [number, number, number];
}

/** A floating bracket card that flips on click to reveal its prediction. */
export function MatchCard3D({ match, home, away, prediction, position }: MatchCard3DProps) {
  const pivot = useRef<THREE.Group>(null);
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  useFrame(() => {
    if (!pivot.current) return;
    const target = flipped ? Math.PI : 0;
    pivot.current.rotation.y += (target - pivot.current.rotation.y) * 0.14;
    const targetScale = hovered ? 1.05 : 1;
    const s = pivot.current.scale.x + (targetScale - pivot.current.scale.x) * 0.15;
    pivot.current.scale.setScalar(s);
  });

  const live = match.status === 'live';
  const finished = match.status === 'finished';
  const scoreText =
    match.score != null ? `${match.score.home} – ${match.score.away}` : formatKickoffDate(match.kickoff);

  return (
    <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.25} floatingRange={[-0.05, 0.05]}>
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
          setFlipped((f) => !f);
        }}
      >
        <group ref={pivot}>
          {/* Card body */}
          <RoundedBox args={[CARD_W, CARD_H, CARD_D]} radius={0.06} smoothness={4}>
            <meshStandardMaterial
              color={hovered ? '#143d2a' : '#0f3322'}
              roughness={0.55}
              metalness={0.1}
              emissive={live ? '#3a0d0d' : '#0a2418'}
              emissiveIntensity={live ? 0.5 : 0.2}
            />
          </RoundedBox>

          {/* Gold edge accent when hovered */}
          {hovered && (
            <RoundedBox args={[CARD_W + 0.04, CARD_H + 0.04, CARD_D * 0.6]} radius={0.06} smoothness={4}>
              <meshBasicMaterial color="#d4a437" transparent opacity={0.16} />
            </RoundedBox>
          )}

          {/* ---- Front face ---- */}
          <CardFront
            homeLabel={home?.id ?? 'TBD'}
            awayLabel={away?.id ?? 'TBD'}
            homeColor={home?.colors.primary ?? '#46876a'}
            awayColor={away?.colors.primary ?? '#46876a'}
            scoreText={scoreText}
            stageText={STAGE_LABEL[match.stage]}
            live={live}
            finished={finished}
          />

          {/* ---- Back face (prediction) — mounted only when flipped ---- */}
          {flipped && (
            <CardBack
              prediction={prediction}
              homeLabel={home?.id ?? 'TBD'}
              awayLabel={away?.id ?? 'TBD'}
              onOpen={() => navigate(`/match/${match.id}`)}
            />
          )}
        </group>
      </group>
    </Float>
  );
}

function CardFront({
  homeLabel,
  awayLabel,
  homeColor,
  awayColor,
  scoreText,
  stageText,
  live,
  finished,
}: {
  homeLabel: string;
  awayLabel: string;
  homeColor: string;
  awayColor: string;
  scoreText: string;
  stageText: string;
  live: boolean;
  finished: boolean;
}) {
  const z = CARD_D / 2 + 0.001;
  return (
    <group position={[0, 0, z]}>
      <Text position={[-0.62, 0.34, 0]} fontSize={0.085} color="#8f8c80" anchorX="left">
        {stageText.toUpperCase()}
      </Text>
      {/* team color chips */}
      <mesh position={[-0.64, 0.08, 0]}>
        <planeGeometry args={[0.06, 0.16]} />
        <meshBasicMaterial color={homeColor} />
      </mesh>
      <mesh position={[-0.64, -0.16, 0]}>
        <planeGeometry args={[0.06, 0.16]} />
        <meshBasicMaterial color={awayColor} />
      </mesh>
      <Text position={[-0.54, 0.08, 0]} fontSize={0.16} color="#f4f1e8" anchorX="left" anchorY="middle">
        {homeLabel}
      </Text>
      <Text position={[-0.54, -0.16, 0]} fontSize={0.16} color="#f4f1e8" anchorX="left" anchorY="middle">
        {awayLabel}
      </Text>
      <Text position={[0.6, -0.04, 0]} fontSize={0.16} color="#d4a437" anchorX="right" anchorY="middle">
        {scoreText}
      </Text>
      <Text position={[0.6, 0.34, 0]} fontSize={0.07} color={live ? '#ff8080' : '#8f8c80'} anchorX="right">
        {live ? 'LIVE' : finished ? 'FT' : 'UPCOMING'}
      </Text>
      <Text position={[0, -0.38, 0]} fontSize={0.06} color="#5a6b60" anchorX="center">
        tap to flip
      </Text>
    </group>
  );
}

function CardBack({
  prediction,
  homeLabel,
  awayLabel,
  onOpen,
}: {
  prediction: MatchPrediction | undefined;
  homeLabel: string;
  awayLabel: string;
  onOpen: () => void;
}) {
  // Back content is rotated 180° about Y so it reads correctly once flipped.
  const z = -(CARD_D / 2 + 0.001);

  if (!prediction) {
    return (
      <group position={[0, 0, z]} rotation={[0, Math.PI, 0]}>
        <Text position={[0, 0, 0]} fontSize={0.08} color="#cfcabb" anchorX="center" maxWidth={1.2}>
          Prediction pending — model not trained yet
        </Text>
      </group>
    );
  }

  const rows: Array<{ label: string; value: number; color: string }> = [
    { label: homeLabel, value: prediction.homeWin, color: '#d4a437' },
    { label: 'Draw', value: prediction.draw, color: '#6fa98e' },
    { label: awayLabel, value: prediction.awayWin, color: '#cfcabb' },
  ];

  return (
    <group position={[0, 0, z]} rotation={[0, Math.PI, 0]}>
      <Text position={[-0.62, 0.34, 0]} fontSize={0.07} color="#8f8c80" anchorX="left">
        MODEL ESTIMATE · ±{(prediction.interval * 100).toFixed(0)} pts
      </Text>
      {rows.map((r, i) => {
        const y = 0.14 - i * 0.18;
        const barW = Math.max(0.02, r.value * 1.0);
        return (
          <group key={r.label} position={[0, y, 0]}>
            <Text position={[-0.62, 0, 0]} fontSize={0.08} color="#f4f1e8" anchorX="left" anchorY="middle">
              {r.label}
            </Text>
            {/* track */}
            <mesh position={[0.05, 0, 0]}>
              <planeGeometry args={[1.0, 0.05]} />
              <meshBasicMaterial color="#0a2418" />
            </mesh>
            {/* fill */}
            <mesh position={[-0.45 + barW / 2, 0, 0.001]}>
              <planeGeometry args={[barW, 0.05]} />
              <meshBasicMaterial color={r.color} />
            </mesh>
            <Text position={[0.62, 0, 0]} fontSize={0.08} color="#f4f1e8" anchorX="right" anchorY="middle">
              {(r.value * 100).toFixed(1)}%
            </Text>
          </group>
        );
      })}
      <Text
        position={[0, -0.38, 0]}
        fontSize={0.07}
        color="#d4a437"
        anchorX="center"
        onPointerDown={(e) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        open details ›
      </Text>
    </group>
  );
}
