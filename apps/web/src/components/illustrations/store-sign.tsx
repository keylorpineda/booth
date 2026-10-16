import { m } from 'motion/react';

/** Hanging store sign that swings gently; used for "store not found" and "closed". */
export function StoreSignIllustration({
  label,
  className = 'size-32',
}: {
  label: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 140 120" className={className} aria-hidden="true" fill="none">
      <path d="M20 14h100" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <m.g
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '70px', originY: '14px' }}
      >
        <path
          d="M50 14l-8 30M90 14l8 30"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="24" y="44" width="92" height="46" rx="12" fill="var(--brand-soft)" />
        <rect x="24" y="44" width="92" height="46" rx="12" stroke="currentColor" strokeWidth="4" />
        <text
          x="70"
          y="73"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="currentColor"
          fontFamily="inherit"
        >
          {label}
        </text>
      </m.g>
    </svg>
  );
}
