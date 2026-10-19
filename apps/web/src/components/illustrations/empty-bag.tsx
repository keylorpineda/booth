import { m } from 'motion/react';

/** Shopping bag that settles in with a little bounce while two sparkles twinkle. */
export function EmptyBagIllustration({ className = 'size-28' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" fill="none">
      <m.g
        initial={{ y: -10, rotate: -6, opacity: 0 }}
        animate={{ y: 0, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 12 }}
        style={{ originX: '60px', originY: '100px' }}
      >
        <rect x="28" y="40" width="64" height="62" rx="12" fill="var(--brand-soft)" />
        <rect x="28" y="40" width="64" height="62" rx="12" stroke="currentColor" strokeWidth="4" />
        <path
          d="M45 52V38a15 15 0 0 1 30 0v14"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M48 74c3.5 4 8 6 12 6s8.5-2 12-6"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </m.g>
      {[
        { x: 98, y: 30, delay: 0.4 },
        { x: 18, y: 50, delay: 0.9 },
      ].map(({ x, y, delay }) => (
        <m.path
          key={`${x}-${y}`}
          d={`M${x} ${y - 6}v12M${x - 6} ${y}h12`}
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1, 0.8, 1], opacity: [0, 1, 0.6, 1] }}
          transition={{ delay, duration: 1.2, repeat: Infinity, repeatDelay: 1.6 }}
          style={{ originX: `${x}px`, originY: `${y}px` }}
        />
      ))}
    </svg>
  );
}
