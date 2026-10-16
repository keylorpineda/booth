import { useState } from 'react';

import { type ProductImage as ProductImageData } from '@booth/shared';

import { cn } from '../../../lib/cn';

interface ProductImageProps {
  image: ProductImageData | undefined;
  alt: string;
  /** CSS sizes hint for the browser to pick a variant. */
  sizes: string;
  priority?: boolean;
  className?: string;
}

/** Responsive image (320/800/1600 px variants) that fades in; a soft monogram without a photo. */
export function ProductImage({
  image,
  alt,
  sizes,
  priority = false,
  className,
}: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);

  if (!image) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'grid place-items-center bg-brand-soft text-4xl font-extrabold text-brand-ink/40',
          className,
        )}
      >
        {alt.trim().charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden bg-surface-sunken', className)}>
      <img
        src={image.urls.medium}
        srcSet={`${image.urls.thumb} 320w, ${image.urls.medium} 800w, ${image.urls.large} 1600w`}
        sizes={sizes}
        alt={alt}
        width={image.width}
        height={image.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => {
          setLoaded(true);
        }}
        className={cn(
          'size-full object-cover transition-[opacity,transform] duration-500 ease-out-soft',
          loaded ? 'scale-100 opacity-100' : 'scale-[1.03] opacity-0',
        )}
      />
    </div>
  );
}
