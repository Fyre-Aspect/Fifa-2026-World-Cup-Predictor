export function Footer() {
  return (
    <footer className="border-t border-pitch-700/40 bg-pitch-950/60 px-4 py-5 text-xs text-offwhite-faint sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="max-w-xl leading-relaxed">
          GroupStage is a forecasting toy, not a betting service. Every figure is a
          model estimate with real uncertainty. Predictions are shown with confidence
          bands and the model&rsquo;s own running accuracy — never as fact.
        </p>
        <p className="shrink-0">
          v0.1 · Open data · <span className="text-offwhite-dim">No affiliation with FIFA</span>
        </p>
      </div>
    </footer>
  );
}
