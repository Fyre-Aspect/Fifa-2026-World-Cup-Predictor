import { Flag } from '@/components/ui/Flag';
import { cn } from '@/lib/cn';
import type { Team } from '@/types/domain';
import {
  effectiveRating,
  hasSquad,
  squadStrength,
  topLeagueCount,
  topPlayers,
} from '@/model/squad';

/**
 * The player-data side of a match: each team's curated key players with their
 * club, the league they earn their football in, and ability rating — plus the
 * overall squad-strength index that feeds the score model. Teams without a
 * curated squad show the Elo-derived strength so the comparison still holds.
 */
export function SquadPanel({ home, away }: { home: Team | undefined; away: Team | undefined }) {
  const hs = squadStrength(home?.id);
  const as = squadStrength(away?.id);
  const max = Math.max(hs, as, 1);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <StrengthCard team={home} strength={hs} pct={hs / max} align="left" />
        <StrengthCard team={away} strength={as} pct={as / max} align="right" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlayerList team={home} />
        <PlayerList team={away} />
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-offwhite-faint">
        Squad strength weights each player&rsquo;s rating by the strength of the
        league he plays in — a top-five-league regular is worth more than the same
        rating in a softer division. This nudges the expected goals, and so the
        predicted scoreline.
      </p>
    </div>
  );
}

function StrengthCard({
  team,
  strength,
  pct,
  align,
}: {
  team: Team | undefined;
  strength: number;
  pct: number;
  align: 'left' | 'right';
}) {
  return (
    <div className={cn('rounded-lg border border-pitch-600/30 bg-pitch-900/40 p-3', align === 'right' && 'text-right')}>
      <div className={cn('flex items-center gap-2', align === 'right' && 'flex-row-reverse')}>
        <Flag code={team?.flagCode} title={team?.name} className="h-4 w-6" />
        <span className="truncate text-sm font-600 text-offwhite">{team?.name ?? 'TBD'}</span>
      </div>
      <div className="mt-2 display-num text-2xl font-700 text-gold-300">{strength.toFixed(1)}</div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-pitch-900">
        <div
          className={cn('h-full rounded-full bg-gold-400/80', align === 'right' && 'ml-auto')}
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-offwhite-faint">
        {hasSquad(team?.id) ? `${topLeagueCount(team?.id)} top-5 league players` : 'rating-derived'}
      </p>
    </div>
  );
}

function PlayerList({ team }: { team: Team | undefined }) {
  const players = topPlayers(team?.id, 6);
  if (players.length === 0) {
    return (
      <div className="rounded-lg border border-pitch-600/30 bg-pitch-900/30 p-3 text-xs text-offwhite-faint">
        No curated squad for {team?.name ?? 'this team'} — strength estimated from team rating.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-pitch-600/30 bg-pitch-900/30 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Flag code={team?.flagCode} title={team?.name} className="h-3.5 w-5" />
        <span className="text-xs font-600 uppercase tracking-wide text-offwhite-dim">
          {team?.name ?? 'TBD'} · key players
        </span>
      </div>
      <ul className="space-y-1.5">
        {players.map((p) => (
          <li key={p.name} className="flex items-center gap-2 text-sm">
            <span className="w-6 shrink-0 text-[10px] font-600 uppercase text-offwhite-faint">
              {p.position}
            </span>
            <span className="min-w-0 flex-1 truncate text-offwhite">{p.name}</span>
            <span className="hidden truncate text-[11px] text-offwhite-faint sm:inline">{p.league}</span>
            <span className="display-num w-8 shrink-0 text-right text-xs font-600 text-gold-300">
              {Math.round(effectiveRating(p))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
