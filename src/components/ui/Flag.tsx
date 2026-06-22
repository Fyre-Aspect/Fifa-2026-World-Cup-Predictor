import { useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Country flag from flagcdn.com (free, public-domain imagery). Falls back to a
 * neutral block if the code is unknown or the image fails to load.
 */
export function Flag({
  code,
  className,
  title,
}: {
  code: string | null | undefined;
  className?: string;
  title?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!code || failed) {
    return (
      <span
        className={cn('inline-block rounded-sm bg-pitch-600', className)}
        aria-label={title ?? 'flag'}
      />
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w80/${code}.png`}
      srcSet={`https://flagcdn.com/w160/${code}.png 2x`}
      alt={title ?? code}
      title={title}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('inline-block rounded-sm object-cover', className)}
    />
  );
}
