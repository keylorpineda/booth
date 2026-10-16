import { cn } from '../../lib/cn';

/** Loading placeholder with a soft shimmer (static under reduced motion). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden rounded-control bg-surface-sunken',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent',
        className,
      )}
    />
  );
}
