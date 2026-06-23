import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RatingPoint } from '@/model/predict';

/** Elo over the team's finished matches in this tournament. */
export function EloTrajectoryChart({ points }: { points: RatingPoint[] }) {
  if (points.length <= 1) {
    return (
      <div className="grid h-48 place-items-center rounded-lg border border-dashed border-pitch-600/40 text-sm text-offwhite-faint">
        Elo trajectory appears once this team has played.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
        <defs>
          <linearGradient id="elo-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a437" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#d4a437" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#15543a" strokeDasharray="3 3" />
        <XAxis dataKey="step" stroke="#8f8c80" fontSize={11} tick={{ fill: '#8f8c80' }} />
        <YAxis
          stroke="#8f8c80"
          fontSize={11}
          tick={{ fill: '#8f8c80' }}
          domain={['dataMin - 20', 'dataMax + 20']}
          width={42}
        />
        <Tooltip
          contentStyle={{
            background: '#0a2e1f',
            border: '1px solid #1a4733',
            borderRadius: 8,
            color: '#f4f1e8',
            fontSize: 12,
          }}
          formatter={(value: number) => [Math.round(value), 'Elo']}
        />
        <Area
          type="monotone"
          dataKey="rating"
          stroke="#d4a437"
          strokeWidth={2}
          fill="url(#elo-fill)"
          isAnimationActive
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
