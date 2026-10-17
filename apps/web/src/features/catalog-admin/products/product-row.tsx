import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { type Product } from '@booth/shared';

import { productBadges } from './product-status';
import { ProductThumb } from './product-thumb';
import { Badge } from '../../../components/ui/badge';
import { cn } from '../../../lib/cn';

interface ProductRowProps {
  product: Product;
  categoryName: string | null;
  price: string;
  /** Null when reordering is not possible (filtered list, demo account). */
  move: { up: boolean; down: boolean; onMove: (delta: -1 | 1) => void } | null;
}

const BADGE_TONES = { inactive: 'neutral', soldOut: 'danger', lowStock: 'warning' } as const;

const iconButton =
  'grid size-10 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken disabled:opacity-30';

/** Photo, name, category, price, stock badges and order buttons. */
export function ProductRow({ product, categoryName, price, move }: ProductRowProps) {
  const { t } = useTranslation();
  const badges = productBadges(product);

  return (
    <li className="flex items-center gap-3 py-3">
      <Link
        to={`/dashboard/catalog/products/${product.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-control"
      >
        <ProductThumb product={product} className={cn(!product.isActive && 'opacity-50')} />
        <div className="min-w-0 flex-1">
          <p className={cn('truncate font-semibold', !product.isActive && 'text-ink-muted')}>
            {product.name}
          </p>
          <p className="truncate text-sm text-ink-muted">
            <span className="font-semibold text-ink tabular-nums">{price}</span>
            {' · '}
            {categoryName ?? t('catalog.products.uncategorized')}
            {product.trackStock
              ? ` · ${t('catalog.products.stock', { count: product.stock })}`
              : ''}
          </p>
          {badges.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <Badge key={badge} tone={BADGE_TONES[badge]}>
                  {t(`catalog.products.badges.${badge}`)}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </Link>
      {move ? (
        <div className="flex">
          <button
            type="button"
            className={iconButton}
            disabled={!move.up}
            aria-label={t('catalog.moveUp', { name: product.name })}
            onClick={() => {
              move.onMove(-1);
            }}
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            disabled={!move.down}
            aria-label={t('catalog.moveDown', { name: product.name })}
            onClick={() => {
              move.onMove(1);
            }}
          >
            <ArrowDown className="size-4" />
          </button>
        </div>
      ) : null}
    </li>
  );
}
