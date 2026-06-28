import { Link } from 'react-router-dom';
import { Flag } from '@/components/ui/Flag';
import { TrophyIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/cn';
import type { ProjectedKnockouts, ProjectedTie } from '@/lib/knockout';
import type { Team } from '@/types/domain';

type Mode = 'projected' | 'official';

/**
 * Knockout bracket as a single scrolling column: each round is a stacked glass
 * section and the field funnels down (32 → 16 → 8 → 4 → 1) to the champion at
 * the foot of the page. In 'projected' mode the winning side and predicted
 * scoreline are highlighted; in 'official' mode empty slots read as TBD.
 */
export function KnockoutBracket({
  proj,
  teams,
  mode,
  linkableIds,
}: {
  proj: ProjectedKnockouts;
  teams: Record<string, Team>;
  mode: Mode;
  linkableIds: Set<string>;
}) {
  const champion = proj.championId ? teams[proj.championId] : undefined;

  const columns: Array<{ label: string; short: string; ties: ProjectedTie[] }> = [
    { label: 'Round of 32', short: 'R32', ties: proj.round32 },
    { label: 'Round of 16', short: 'R16', ties: proj.round16 },
    { label: 'Quarter-finals', short: 'QF', ties: proj.quarter },
    { label: 'Semi-finals', short: 'SF', ties: proj.semi },
    { label: 'Final', short: 'F', ties: proj.final ? [proj.final] : [] },
  ];

  return (
    <div className="space-y-4">
      {columns.map((col) => (
        <section key={col.short} className="surface rounded-xl p-3 sm:p-4">
          <div className="mb-2.5 flex items-baseline justify-between">
            <h3 className="text-[11px] font-700 uppercase tracking-wide text-offwhite-dim">
              {col.label}
            </h3>
            <span className="text-[10px] text-offwhite-faint">
              {col.ties.length} {col.ties.length === 1 ? 'tie' : 'ties'}
            </span>
          </div>
          <div className="space-y-2">
            {col.ties.map((tie) => (
              <TieCard
                key={tie.id}
                tie={tie}
                teams={teams}
                mode={mode}
                linkable={linkableIds.has(tie.id)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Third-place play-off */}
      {proj.third && (
        <section className="surface rounded-xl p-3 sm:p-4">
          <h3 className="mb-2.5 text-[11px] font-700 uppercase tracking-wide text-offwhite-faint">
            Third place
          </h3>
          <TieCard tie={proj.third} teams={teams} mode={mode} linkable={false} />
        </section>
      )}

      {/* Champion — the destination at the foot of the scroll. */}
      <section className="surface-raised relative overflow-hidden rounded-2xl border border-gold-400/40 bg-gold-400/5 p-5 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-48 w-72 -translate-x-1/2"
          style={{ backgroundImage: 'radial-gradient(closest-side, rgba(240,180,41,0.28), transparent)' }}
        />
        <div className="relative">
          <div className="mb-1 flex justify-center text-gold-300">
            <TrophyIcon className="h-7 w-7" />
          </div>
          <p className="text-[11px] font-700 uppercase tracking-widest text-gold-300">
            {mode === 'projected' ? 'Projected champion' : 'Champion'}
          </p>
          <div className="mt-1.5 flex items-center justify-center gap-2">
            <Flag code={champion?.flagCode} title={champion?.name} className="h-5 w-7" />
            <span className="font-display text-xl font-700 text-offwhite sm:text-2xl">
              {champion?.name ?? 'TBD'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function TieCard({
  tie,
  teams,
  mode,
  linkable,
}: {
  tie: ProjectedTie;
  teams: Record<string, Team>;
  mode: Mode;
  linkable: boolean;
}) {
  const home = tie.homeId ? teams[tie.homeId] : undefined;
  const away = tie.awayId ? teams[tie.awayId] : undefined;

  const body = (
    <div className="surface rounded-lg p-1.5">
      <TeamRow
        team={home}
        win={tie.winnerId != null && tie.winnerId === tie.homeId}
        goals={mode === 'projected' ? tie.scoreline?.home : undefined}
      />
      <div className="my-0.5 h-px bg-white/5" />
      <TeamRow
        team={away}
        win={tie.winnerId != null && tie.winnerId === tie.awayId}
        goals={mode === 'projected' ? tie.scoreline?.away : undefined}
      />
      {mode === 'projected' && tie.aet && (
        <p className="mt-0.5 text-center text-[8px] font-600 uppercase tracking-wide text-offwhite-faint">
          after extra time
        </p>
      )}
    </div>
  );

  return linkable && home && away ? (
    <Link to={`/match/${tie.id}`} className="interactive block">
      {body}
    </Link>
  ) : (
    body
  );
}

function TeamRow({
  team,
  win,
  goals,
}: {
  team: Team | undefined;
  win: boolean;
  goals: number | undefined;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded px-1 py-1',
        win && 'bg-gold-400/10',
      )}
    >
      <Flag code={team?.flagCode} title={team?.name} className="h-3 w-[18px] shrink-0 rounded-[2px]" />
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[12px]',
          win ? 'font-700 text-offwhite' : 'text-offwhite-dim',
        )}
      >
        {team?.name ?? 'TBD'}
      </span>
      {goals != null && (
        <span
          className={cn(
            'display-num w-3.5 shrink-0 text-right text-[12px] font-700',
            win ? 'text-gold-300' : 'text-offwhite-faint',
          )}
        >
          {goals}
        </span>
      )}
    </div>
  );
}
