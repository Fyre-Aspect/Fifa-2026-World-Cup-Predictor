import { cn } from '@/lib/cn';

/** Shimmer skeleton block. Loading states use these, never spinners. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}
