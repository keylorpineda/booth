import { AnimatePresence, m } from 'motion/react';

import { spring } from '../../lib/motion';

/** A number that rolls up or down when it changes (quantities, cart count). */
export function AnimatedNumber({
  value,
  className,
}: {
  value: number | string;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex overflow-hidden tabular-nums ${className ?? ''}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={value}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={spring.snappy}
        >
          {value}
        </m.span>
      </AnimatePresence>
    </span>
  );
}
