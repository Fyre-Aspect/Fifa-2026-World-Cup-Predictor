import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * Renders a value that flips vertically whenever it changes — the small reveal
 * animation used across prediction updates. Honors the user's reduced-motion
 * preference implicitly via Framer Motion's short, subtle transition.
 */
export function FlipNumber({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn('relative inline-flex overflow-hidden', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '110%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-110%', opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block tabular"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
