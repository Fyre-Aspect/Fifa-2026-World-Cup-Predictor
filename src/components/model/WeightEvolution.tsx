import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WeightSnapshot } from '@/types/domain';

const SERIES: Array<{ key: keyof WeightSnapshot['weights']; label: string; color: string }> = [
  { key: 'elo', label: 'Elo', color: '#d4a437' },
  { key: 'form', label: 'Form', color: '#6fa98e' },
  { key: 'polymarket', label: 'Polymarket', color: '#6fa9d6' },
  { key: 'books', label: 'Books', color: '#cfcabb' },
];

/**
 * The weight trajectory over the tournament: each input's weight after every
 * finished match. A flat line at the left means "no results yet"; the lines
 * fan out as the model learns which inputs to trust.
 */
export function WeightEvolution({ history }: { history: WeightSnapshot[] }) {
  if (history.length <= 1) {
    return (
      <div className="grid h-56 place-items-center rounded-lg border border-dashed border-pitch-600/40 text-center text-sm text-offwhite-faint">
        Weights evolve here as matches finish and the model learns.
      </div>
    );
  }

  const data = history.map((snap, i) => ({
    step: i,
    elo: snap.weights.elo * 100,
    form: snap.weights.form * 100,
    polymarket: snap.weights.polymarket * 100,
    books: snap.weights.books * 100,
  }));

  return (
    <>
      <ResponsiveContainer width="100%" height={224}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -12 }}>
          <CartesianGrid stroke="#15543a" strokeDasharray="3 3" />
          <XAxis
            dataKey="step"
            stroke="#8f8c80"
            fontSize={11}
            tick={{ fill: '#8f8c80' }}
            label={{ value: 'matches scored', position: 'insideBottom', offset: -2, fill: '#8f8c80', fontSize: 11 }}
          />
          <YAxis
            stroke="#8f8c80"
            fontSize={11}
            tick={{ fill: '#8f8c80' }}
            tickFormatter={(v: number) => `${v}%`}
            domain={[0, 'dataMax + 5']}
          />
          <Tooltip
            contentStyle={{
              background: '#0a2e1f',
              border: '1px solid #1a4733',
              borderRadius: 8,
              color: '#f4f1e8',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
          />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={600}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-offwhite-dim">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </>
  );
}
