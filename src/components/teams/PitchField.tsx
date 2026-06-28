/**
 * A full-height football pitch drawn purely in CSS — mowed-grass stripes, chalk
 * markings (touchlines, halfway line, centre circle, both penalty boxes) and a
 * floodlight glow over the top box where the strongest side sits. It fills its
 * positioned parent and scrolls with the page, so the ranking flows "down the
 * pitch" from the leader at the top. Decorative only — sits behind the content.
 */
export function PitchField() {
  const chalk = 'border-white/[0.09]';

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Grass: deep night-match green fading into the page navy at the foot. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(180deg,#0c3a2c 0%,#0a3026 42%,#082720 74%,#070b1c 100%)',
        }}
      />
      {/* Mowed stripes. */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'repeating-linear-gradient(180deg, rgba(255,255,255,0.045) 0, rgba(255,255,255,0.045) 76px, transparent 76px, transparent 152px)',
        }}
      />
      {/* Floodlight on the leader's box + faint FIFA accents to tie into theme. */}
      <div
        className="absolute -top-40 left-1/2 h-[30rem] w-[150%] -translate-x-1/2"
        style={{ backgroundImage: 'radial-gradient(closest-side, rgba(240,180,41,0.16), transparent)' }}
      />
      <div
        className="absolute top-1/4 -left-24 h-96 w-96"
        style={{ backgroundImage: 'radial-gradient(closest-side, rgba(25,227,214,0.10), transparent)' }}
      />
      <div
        className="absolute top-[62%] -right-24 h-96 w-96"
        style={{ backgroundImage: 'radial-gradient(closest-side, rgba(255,46,136,0.08), transparent)' }}
      />

      {/* Chalk markings. */}
      <div className={`absolute inset-x-4 top-3 bottom-3 rounded border ${chalk} sm:inset-x-8`} />
      <div className={`absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-white/[0.09] sm:left-8 sm:right-8`} />
      <div className={`absolute left-1/2 top-1/2 aspect-square w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border ${chalk} sm:w-60`} />
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />

      {/* Top penalty + goal box (the champion's end). */}
      <div className={`absolute left-1/2 top-3 h-40 w-3/5 max-w-md -translate-x-1/2 rounded-b border border-t-0 ${chalk}`} />
      <div className={`absolute left-1/2 top-3 h-16 w-2/5 max-w-[16rem] -translate-x-1/2 rounded-b border border-t-0 ${chalk}`} />
      {/* Bottom penalty + goal box. */}
      <div className={`absolute bottom-3 left-1/2 h-40 w-3/5 max-w-md -translate-x-1/2 rounded-t border border-b-0 ${chalk}`} />
      <div className={`absolute bottom-3 left-1/2 h-16 w-2/5 max-w-[16rem] -translate-x-1/2 rounded-t border border-b-0 ${chalk}`} />

      {/* Vignette to keep glass cards and text legible over the grass. */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(130% 90% at 50% 0%, transparent 45%, rgba(7,11,28,0.55) 100%)' }}
      />
    </div>
  );
}
