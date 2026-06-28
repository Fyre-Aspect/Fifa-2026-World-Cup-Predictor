import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { RESULTS_AS_OF } from '@/data/realResults';

const snapshotDate = new Date(RESULTS_AS_OF).toLocaleDateString(undefined, {
  day: 'numeric',
  month: 'short',
});

const SOURCE_LABEL: Record<'loading' | 'live' | 'mock', { text: string; tone: string }> = {
  loading: { text: 'Loading data…', tone: 'text-offwhite-faint' },
  live: { text: 'Live data', tone: 'text-pitch-200' },
  mock: { text: `Results snapshot · ${snapshotDate} (not live)`, tone: 'text-gold-300' },
};

export function Footer() {
  const dataSource = useStore((s) => s.dataSource);
  const source = SOURCE_LABEL[dataSource];

  return (
    <footer className="relative z-10 border-t border-pitch-700/40 bg-pitch-950/80 px-4 py-5 text-xs text-offwhite-faint backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="max-w-xl leading-relaxed">
          A predictions site for fun, not a betting service. Every number is an
          estimate, not a fact.
        </p>
        <p className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
          <Link to="/model" className="font-600 text-gold-300 hover:text-gold-200">
            How the model works
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                dataSource === 'live'
                  ? 'bg-pitch-300'
                  : dataSource === 'mock'
                    ? 'bg-gold-400'
                    : 'bg-offwhite-faint'
              }`}
            />
            <span className={source.tone}>{source.text}</span>
          </span>
          <span>v0.1 · <span className="text-offwhite-dim">No affiliation with FIFA</span></span>
        </p>
      </div>
    </footer>
  );
}
