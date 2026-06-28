import { cn } from '@/lib/cn';
import type { Team } from '@/types/domain';
import type { Player, Position } from '@/data/squads';
import { effectiveRating, fullSquad, hasSquad, squadStrength, topLeagueCount } from '@/model/squad';

const LINES: { key: Position; label: string }[] = [
  { key: 'GK', label: 'Goalkeeper' },
  { key: 'DF', label: 'Defence' },
  { key: 'MF', label: 'Midfield' },
  { key: 'FW', label: 'Attack' },
];

const POSITION_TONE: Record<Position, string> = {
  GK: 'bg-amber-400/15 text-amber-200',
  DF: 'bg-cyan-400/15 text-cyan-200',
  MF: 'bg-emerald-400/15 text-emerald-200',
  FW: 'bg-magenta-400/15 text-magenta-200',
};

/**
 * The team's squad on its own page — the curated players laid out like a team
 * sheet (goalkeeper, defence, midfield, attack), each with club, league and
 * ability rating. Teams without curated player data say so plainly.
 */
export function TeamSquad({ team }: { team: Team }) {
  const players = fullSquad(team.id);

  if (!hasSquad(team.id) || players.length === 0) {
    return (
      <section className="surface mt-4 p-5">
        <SectionHeading />
        <p className="mt-2 text-sm text-offwhite-dim">
          No player list curated for {team.name} yet — its strength is estimated from the
          team&rsquo;s overall rating instead.
        </p>
      </section>
    );
  }

  const strength = squadStrength(team.id);

  return (
    <section className="surface mt-4 p-5">
      <div className="flex items-end justify-between gap-3">
        <SectionHeading count={players.length} />
        <div className="text-right">
          <span className="display-num text-xl font-700 text-gold-300">{strength.toFixed(1)}</span>
          <p className="text-[11px] text-offwhite-faint">
            squad strength · {topLeagueCount(team.id)} in a top-5 league
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {LINES.map(({ key, label }) => {
          const line = players.filter((p) => p.position === key);
          if (line.length === 0) return null;
          return (
            <div key={key}>
              <p className="mb-1.5 text-[11px] font-700 uppercase tracking-wider text-offwhite-faint">
                {label}
              </p>
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {line.map((p) => (
                  <PlayerRow key={`${p.name}-${p.club}`} player={p} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-offwhite-faint">
        A representative spine of each team&rsquo;s key players. The rating shown is league-adjusted —
        the same ability counts for more in a stronger division — and it feeds the squad-strength
        input behind every predicted scoreline.
      </p>
    </section>
  );
}

function SectionHeading({ count }: { count?: number }) {
  return (
    <h2 className="text-sm font-700 uppercase tracking-wider text-offwhite-dim">
      Squad{count != null ? ` · ${count} key players` : ''}
    </h2>
  );
}

function PlayerRow({ player }: { player: Player }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-white/5 bg-pitch-900/40 px-3 py-2">
      <span
        className={cn(
          'grid h-7 w-7 shrink-0 place-items-center rounded-md text-[10px] font-700',
          POSITION_TONE[player.position],
        )}
      >
        {player.position}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-600 text-offwhite">{player.name}</p>
        <p className="truncate text-[11px] text-offwhite-faint">
          {player.club} · {player.league}
        </p>
      </div>
      <span className="display-num shrink-0 rounded-md bg-gold-400/15 px-2 py-1 text-sm font-700 text-gold-300">
        {Math.round(effectiveRating(player))}
      </span>
    </li>
  );
}
