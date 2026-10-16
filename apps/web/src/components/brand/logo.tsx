import { cn } from '../../lib/cn';

interface LogoProps {
  className?: string;
  withText?: boolean;
  /** Light tile for brand-colored backgrounds. */
  inverted?: boolean;
}

/** Booth mark (a market stall awning) + wordmark. The mark follows the brand color. */
export function Logo({ className, withText = true, inverted = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-8 shrink-0">
        <rect
          width="32"
          height="32"
          rx="9"
          className={inverted ? 'fill-brand-foreground' : 'fill-brand'}
        />
        <g
          className={
            inverted ? 'fill-brand stroke-brand' : 'fill-brand-foreground stroke-brand-foreground'
          }
        >
          <path
            d="M7 12.5 9.2 8h13.6L25 12.5c0 1.66-1.34 3-3 3s-3-1.34-3-3c0 1.66-1.34 3-3 3s-3-1.34-3-3c0 1.66-1.34 3-3 3s-3-1.34-3-3Z"
            strokeWidth="0"
          />
          <path
            d="M9 17.5V24h14v-6.5"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
      {withText ? (
        <span className="font-display text-xl font-extrabold tracking-tight">Booth</span>
      ) : null}
    </span>
  );
}
