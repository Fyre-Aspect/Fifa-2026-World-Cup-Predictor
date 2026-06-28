import { Link } from 'react-router-dom';
import { Flag } from '@/components/ui/Flag';
import { WorldCupLogo } from '@/components/ui/WorldCupLogo';
import { cn } from '@/lib/cn';
import type { ProjectedKnockouts, ProjectedTie } from '@/lib/knockout';
import type { Team } from '@/types/domain';

type Mode = 'projected' | 'official';

/**
 * Flat, readable knockout bracket. Each round is a column; rounds narrow left to
 * right (32 → 16 → 8 → 4 → 1) into the champion, who carries the gold World Cup
 * emblem. In 'projected' mode the winning side and predicted scoreline are
 * highlighted; in 'official' mode empty slots read as TBD until the real draw.
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
    <div className="overflow-x-auto pb-3 [scrollbar-width:thin]">
      <div className="flex min-w-max items-stretch gap-2.5 sm:gap-4">
        {columns.map((col) => (
          <div key={col.short} className="flex w-[176px] shrink-0 flex-col sm:w-[196px]">
            <h3 className="mb-2 text-center text-[11px] font-700 uppercase tracking-wide text-offwhite-dim">
              {col.label}
            </h3>
            <div className="flex flex-1 flex-col justify-around gap-2">
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
          </div>
        ))}

        {/* Champion */}
        <div className="flex w-[176px] shrink-0 flex-col sm:w-[196px]">
          <h3 className="mb-2 text-center text-[11px] font-700 uppercase tracking-wide text-gold-300">
            Champion
          </h3>
          <div className="flex flex-1 flex-col justify-center">
            <div className="surface-raised relative overflow-hidden rounded-xl border border-gold-400/40 bg-gold-400/5 p-4 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2"
                style={{ backgroundImage: 'radial-gradient(closest-side, rgba(240,180,41,0.28), transparent)' }}
              />
              <div className="relative flex items-center justify-center gap-2">
                <WorldCupLogo className="h-12 w-10 shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Flag code={champion?.flagCode} title={champion?.name} className="h-4 w-6 shrink-0" />
                    <span className="truncate font-display text-base font-700 text-offwhite">
                      {champion?.name ?? 'TBD'}
                    </span>
                  </div>
                  {mode === 'projected' && (
                    <p className="mt-0.5 text-left text-[9px] uppercase tracking-wide text-gold-300/80">
                      Projected winner
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third-place play-off */}
      {proj.third && (
        <div className="mt-4 max-w-[200px]">
          <h3 className="mb-2 text-[11px] font-700 uppercase tracking-wide text-offwhite-faint">
            Third place
          </h3>
          <TieCard tie={proj.third} teams={teams} mode={mode} linkable={false} />
        </div>
      )}
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
