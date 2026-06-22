import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** Consistent title block + content region for the 2D-framed views. */
export function ViewScaffold({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-8 max-w-2xl"
      >
        <p className="text-xs font-600 uppercase tracking-widest text-gold-300">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-700 tracking-tight text-offwhite">
          {title}
        </h1>
        <p className="mt-3 text-offwhite-dim">{description}</p>
      </motion.header>
      {children}
    </div>
  );
}
