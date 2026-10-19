import { type Product } from '@booth/shared';

import { cn } from '../../../lib/cn';

/** First image (the cover) as a small square, or a monogram when there is no photo yet. */
export function ProductThumb({ product, className }: { product: Product; className?: string }) {
  const cover = product.images[0];
  return (
    <div
      aria-hidden="true"
      className={cn(
        'grid size-14 shrink-0 place-items-center overflow-hidden rounded-control bg-brand-soft text-lg font-extrabold text-brand-ink/50',
        className,
      )}
    >
      {cover ? (
        <img
          src={cover.urls.thumb}
          alt=""
          width={56}
          height={56}
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        product.name.trim().charAt(0).toUpperCase()
      )}
    </div>
  );
}
