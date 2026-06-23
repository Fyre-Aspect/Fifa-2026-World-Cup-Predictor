import { useStore } from '@/store/useStore';
import { MatchRow } from '@/components/match/MatchRow';
import { STAGE_LABEL, STAGE_TIER } from '@/lib/tournament';
import type { Match, MatchStage } from '@/types/domain';

/** 2D bracket: matches grouped by stage, final first. Used on small screens. */
export function Bracket2D() {
  const matches = useStore((s) => s.matches);

  const byStage = new Map<MatchStage, Match[]>();
  for (const m of matches) {
    if (m.stage === 'group') continue; // group stage lives on its own tab
    const arr = byStage.get(m.stage) ?? [];
    arr.push(m);
    byStage.set(m.stage, arr);
  }
  const stages = [...byStage.keys()].sort((a, b) => STAGE_TIER[b] - STAGE_TIER[a]);

  return (
    <div className="space-y-4">
      {stages.map((stage) => (
        <section key={stage} className="surface p-4">
          <h2 className="mb-3 text-sm font-600 uppercase tracking-wider text-offwhite-dim">
            {STAGE_LABEL[stage]}
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(byStage.get(stage) ?? [])
              .slice()
              .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff))
              .map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
