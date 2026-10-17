import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { type ProductImage } from '@booth/shared';

import { cn } from '../../../lib/cn';

interface ImageTileProps {
  image: ProductImage;
  index: number;
  count: number;
  disabled: boolean;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
}

const control =
  'grid size-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70 disabled:opacity-30';

/** One photo with move left/right and delete; the first one is the cover. */
export function ImageTile({ image, index, count, disabled, onMove, onDelete }: ImageTileProps) {
  const { t } = useTranslation();
  const position = { position: index + 1 };

  return (
    <m.li
      layout
      className="relative aspect-square overflow-hidden rounded-control bg-surface-sunken"
    >
      <img
        src={image.urls.thumb}
        alt={t('catalog.images.alt', position)}
        width={image.width}
        height={image.height}
        loading="lazy"
        className="size-full object-cover"
      />
      {index === 0 ? (
        <span className="absolute top-2 left-2 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-brand-foreground">
          {t('catalog.images.cover')}
        </span>
      ) : null}
      <div className="absolute inset-x-2 bottom-2 flex justify-between">
        <div className="flex gap-1">
          <button
            type="button"
            className={control}
            disabled={disabled || index === 0}
            aria-label={t('catalog.images.moveLeft', position)}
            onClick={() => {
              onMove(-1);
            }}
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            type="button"
            className={control}
            disabled={disabled || index === count - 1}
            aria-label={t('catalog.images.moveRight', position)}
            onClick={() => {
              onMove(1);
            }}
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
        <button
          type="button"
          className={cn(control, 'hover:bg-danger')}
          disabled={disabled}
          aria-label={t('catalog.images.delete', position)}
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </m.li>
  );
}
