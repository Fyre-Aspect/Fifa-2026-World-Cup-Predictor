import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { useStore } from '@/store/useStore';
import { STAGE_LABEL, STAGE_TIER } from '@/lib/tournament';
import type { Match, MatchStage } from '@/types/domain';
import { MatchCard3D } from './MatchCard3D';

const TIER_GAP = 1.55;
const STEP_X = 1.78;

interface PlacedMatch {
  match: Match;
  position: [number, number, number];
}

interface TierRow {
  stage: MatchStage;
  y: number;
}

/**
 * The 3D tournament tree: matches as floating cards in tiers, group stage at
 * the bottom rising to the final at the top. The camera orbits gently
 * (handled by the Stage's OrbitControls).
 */
export function Bracket3D() {
  const matches = useStore((s) => s.matches);
  const teams = useStore((s) => s.teams);
  const predictions = useStore((s) => s.predictions);

  const { placed, tiers, halfWidth } = useMemo(() => {
    // Group present stages, ordered group -> final.
    const byStage = new Map<MatchStage, Match[]>();
    for (const m of matches) {
      const arr = byStage.get(m.stage) ?? [];
      arr.push(m);
      byStage.set(m.stage, arr);
    }
    const stages = [...byStage.keys()].sort((a, b) => STAGE_TIER[a] - STAGE_TIER[b]);
    const rowCount = stages.length;
    const yOffset = ((rowCount - 1) * TIER_GAP) / 2;

    let maxHalf = 0;
    const placedMatches: PlacedMatch[] = [];
    const tierRows: TierRow[] = [];

    stages.forEach((stage, rowIndex) => {
      const row = (byStage.get(stage) ?? []).slice().sort((a, b) => a.id.localeCompare(b.id));
      const y = rowIndex * TIER_GAP - yOffset;
      tierRows.push({ stage, y });
      const half = ((row.length - 1) * STEP_X) / 2;
      maxHalf = Math.max(maxHalf, half);
      row.forEach((match, i) => {
        const x = i * STEP_X - half;
        placedMatches.push({ match, position: [x, y, 0] });
      });
    });

    return { placed: placedMatches, tiers: tierRows, halfWidth: maxHalf };
  }, [matches]);

  return (
    <group>
      {/* Tier labels down the left side. */}
      {tiers.map((t) => (
        <Text
          key={t.stage}
          position={[-(halfWidth + 1.6), t.y, 0]}
          fontSize={0.16}
          color="#5a6b60"
          anchorX="left"
          anchorY="middle"
        >
          {STAGE_LABEL[t.stage].toUpperCase()}
        </Text>
      ))}

      {placed.map(({ match, position }) => (
        <MatchCard3D
          key={match.id}
          match={match}
          home={match.homeTeamId ? teams[match.homeTeamId] : undefined}
          away={match.awayTeamId ? teams[match.awayTeamId] : undefined}
          prediction={predictions[match.id]}
          position={position}
        />
      ))}
    </group>
  );
}
