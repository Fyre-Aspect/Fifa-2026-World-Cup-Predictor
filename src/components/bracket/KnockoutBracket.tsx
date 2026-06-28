import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Flag } from '@/components/ui/Flag';
import { WorldCupLogo } from '@/components/ui/WorldCupLogo';
import { cn } from '@/lib/cn';
import type { ProjectedKnockouts, ProjectedTie } from '@/lib/knockout';
import type { Team } from '@/types/domain';

type Mode = 'projected' | 'official';

/** Official 2026 bracket tree, by index into each round's canonical order. */
const R16_FEEDERS = [[1, 4], [0, 2], [3, 5], [6, 7], [10, 11], [8, 9], [13, 15], [12, 14]] as const;
const QF_FEEDERS = [[0, 1], [4, 5], [2, 3], [6, 7]] as const;
const SF_FEEDERS = [[0, 1], [2, 3]] as const;

const ROUND_LABELS = ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final', 'Champion'];

interface BracketNode {
  tie: ProjectedTie | null;
  children?: [BracketNode, BracketNode];
}

/** Assemble the bracket as a binary tree (final at the root, R32 ties as leaves). */
function buildTree(proj: ProjectedKnockouts): BracketNode {
  const leaf = (i: number): BracketNode => ({ tie: proj.round32[i] ?? null });
  const r16 = R16_FEEDERS.map(([a, b], i) => ({
    tie: proj.round16[i] ?? null,
    children: [leaf(a), leaf(b)] as [BracketNode, BracketNode],
  }));
  const qf = QF_FEEDERS.map(([a, b], i) => ({
    tie: proj.quarter[i] ?? null,
    children: [r16[a], r16[b]] as [BracketNode, BracketNode],
  }));
  const sf = SF_FEEDERS.map(([a, b], i) => ({
    tie: proj.semi[i] ?? null,
    children: [qf[a], qf[b]] as [BracketNode, BracketNode],
  }));
  return { tie: proj.final, children: [sf[0], sf[1]] };
}

/**
 * The knockout bracket as a connected tree: every match is drawn centred between
 * the two it draws from, with an SVG connector in the gap, narrowing left to
 * right (32 → 16 → 8 → 4 → 1) to the champion. In 'projected' mode the winning
 * side and predicted scoreline are highlighted; in 'official' mode the slots read
 * as their teams (or position labels / TBD) with no projection.
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
  const tree = buildTree(proj);

  const card = (tie: ProjectedTie | null) =>
    tie ? (
      <TieCard tie={tie} teams={teams} mode={mode} linkable={linkableIds.has(tie.id)} />
    ) : (
      <div className="surface rounded-lg p-1.5 text-center text-[12px] italic text-offwhite-faint">TBD</div>
    );

  const renderNode = (node: BracketNode, key: string): ReactNode => {
    if (!node.children) {
      return <div key={key} className="bkt-card">{card(node.tie)}</div>;
    }
    return (
      <div key={key} className="bkt-node">
        <div className="bkt-children">
          {renderNode(node.children[0], `${key}0`)}
          {renderNode(node.children[1], `${key}1`)}
        </div>
        <Connector />
        <div className="bkt-card">{card(node.tie)}</div>
      </div>
    );
  };

  return (
    <div className="bkt overflow-x-auto pb-3 [scrollbar-width:thin]">
      <div className="bkt-head">
        {ROUND_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              'bkt-head-col text-[11px] font-700 uppercase tracking-wide',
              i === ROUND_LABELS.length - 1 ? 'text-gold-300' : 'text-offwhite-dim',
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="bkt-node">
        {renderNode(tree, 'r')}
        <Connector straight />
        <div className="bkt-card">
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

      {/* Third-place play-off */}
      {proj.third && (
        <div className="mt-5 max-w-[12.25rem]">
          <h3 className="mb-2 text-[11px] font-700 uppercase tracking-wide text-offwhite-faint">
            Third place
          </h3>
          <TieCard tie={proj.third} teams={teams} mode={mode} linkable={false} />
        </div>
      )}
    </div>
  );
}

/** SVG connector drawn in the gap between a pair of feeders and the match they feed. */
function Connector({ straight }: { straight?: boolean }) {
  return (
    <svg className="bkt-conn" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden>
      <path d={straight ? 'M0,50 H10' : 'M0,25 H6 V75 H0 M6,50 H10'} />
    </svg>
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
        label={tie.homeLabel}
        win={tie.winnerId != null && tie.winnerId === tie.homeId}
        goals={mode === 'projected' ? tie.scoreline?.home : undefined}
      />
      <div className="my-0.5 h-px bg-white/5" />
      <TeamRow
        team={away}
        label={tie.awayLabel}
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
  label,
  win,
  goals,
}: {
  team: Team | undefined;
  label?: string | null;
  win: boolean;
  goals: number | undefined;
}) {
  // No team yet: show the official position slot ("Runner-up A") or plain TBD.
  if (!team) {
    return (
      <div className="flex items-center gap-1.5 rounded px-1 py-1">
        <span className="h-3 w-[18px] shrink-0 rounded-[2px] bg-white/5" />
        <span className="min-w-0 flex-1 truncate text-[12px] italic text-offwhite-faint">
          {label ?? 'TBD'}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded px-1 py-1',
        win && 'bg-gold-400/10',
      )}
    >
      <Flag code={team.flagCode} title={team.name} className="h-3 w-[18px] shrink-0 rounded-[2px]" />
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[12px]',
          win ? 'font-700 text-offwhite' : 'text-offwhite-dim',
        )}
      >
        {team.name}
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
