import { useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * The World Cup 2026 logo, served from public/wc2026-logo.png. If the asset
 * isn't present it renders nothing (no placeholder), so the champion card stays
 * clean until the real logo is dropped in.
 */
export function WorldCupLogo({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      src="/wc2026-logo.png"
      alt="FIFA World Cup 2026"
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-contain', className)}
    />
  );
}
