import { m } from 'motion/react';

/** A magnifying glass sweeping over an empty card: "we looked, nothing is here". */
export function LostSearchIllustration({ className = 'size-32' }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 120" className={className} aria-hidden="true" fill="none">
      <rect x="18" y="22" width="86" height="72" rx="12" fill="var(--brand-soft)" />
      <rect x="18" y="22" width="86" height="72" rx="12" stroke="currentColor" strokeWidth="4" />
      <path
        d="M34 44h40M34 58h28M34 72h34"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.35"
      />
      <m.g
        animate={{ x: [0, -14, 0], y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle
          cx="96"
          cy="70"
          r="18"
          fill="var(--surface-raised)"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path d="M109 83l13 13" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <path
          d="M91 65l10 10M101 65l-10 10"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </m.g>
    </svg>
  );
}
