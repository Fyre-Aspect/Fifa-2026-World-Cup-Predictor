import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { CalibrationBin } from '@/model/scoring';

/**
 * Reliability diagram: predicted probability (x) against observed frequency (y)
 * for the model's most-confident pick. A perfectly calibrated model sits on the
 * dashed diagonal. Bubble size encodes how many matches fall in each bin.
 */
export function CalibrationChart({ bins }: { bins: CalibrationBin[] }) {
  const points = bins
    .filter((b) => b.count > 0)
    .map((b) => ({ x: b.predicted, y: b.observed, count: b.count }));

  if (points.length === 0) {
    return (
      <div className="grid h-56 place-items-center rounded-lg border border-dashed border-pitch-600/40 text-sm text-offwhite-faint">
        Calibration appears once matches have been scored.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <ScatterChart margin={{ top: 10, right: 16, bottom: 8, left: -8 }}>
        <CartesianGrid stroke="#15543a" strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="x"
          domain={[0.3, 1]}
          tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
          stroke="#8f8c80"
          fontSize={11}
          tick={{ fill: '#8f8c80' }}
          label={{ value: 'Predicted', position: 'insideBottom', offset: -2, fill: '#8f8c80', fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          domain={[0, 1]}
          tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
          stroke="#8f8c80"
          fontSize={11}
          tick={{ fill: '#8f8c80' }}
        />
        <ZAxis type="number" dataKey="count" range={[60, 360]} />
        <ReferenceLine
          segment={[
            { x: 0.3, y: 0.3 },
            { x: 1, y: 1 },
          ]}
          stroke="#6fa98e"
          strokeDasharray="5 5"
          ifOverflow="extendDomain"
        />
        <Tooltip
          cursor={{ stroke: '#d4a437', strokeOpacity: 0.3 }}
          contentStyle={{
            background: '#0a2e1f',
            border: '1px solid #1a4733',
            borderRadius: 8,
            color: '#f4f1e8',
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => [`${Math.round(value * 100)}%`, name === 'y' ? 'Observed' : 'Predicted']}
        />
        <Scatter data={points} fill="#d4a437" fillOpacity={0.8} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
