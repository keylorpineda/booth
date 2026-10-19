import { m } from 'motion/react';

import { spring } from '../../lib/motion';

/** Order placed: the circle draws itself, then the check, then a soft ripple. */
export function SuccessCheck({ className = 'size-24' }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" fill="none">
      <m.circle
        cx="48"
        cy="48"
        r="44"
        fill="var(--brand-soft)"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.6, 1.08, 1], opacity: [0, 0.5, 0] }}
        transition={{ delay: 0.7, duration: 1.1, ease: 'easeOut' }}
        style={{ originX: '48px', originY: '48px' }}
      />
      <m.circle
        cx="48"
        cy="48"
        r="34"
        stroke="var(--brand)"
        strokeWidth="6"
        initial={{ pathLength: 0, rotate: -90 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ originX: '48px', originY: '48px' }}
      />
      <m.path
        d="M33 49l10 10 20-22"
        stroke="var(--brand)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ ...spring.bouncy, delay: 0.45 }}
      />
    </svg>
  );
}
