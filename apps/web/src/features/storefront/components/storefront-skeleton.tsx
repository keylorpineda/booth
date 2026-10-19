import { Skeleton } from '../../../components/ui/skeleton';

/** Mirrors the real layout so nothing jumps when data arrives. */
export function StorefrontSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <Skeleton className="h-40 rounded-none sm:h-56" />
      <div className="mx-auto max-w-5xl px-4">
        <Skeleton className="-mt-10 size-20 rounded-card border-4 border-surface" />
        <Skeleton className="mt-3 h-8 w-2/3 max-w-sm" />
        <Skeleton className="mt-2 h-4 w-1/2 max-w-xs" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-card sm:h-64" />
          ))}
        </div>
      </div>
    </div>
  );
}
