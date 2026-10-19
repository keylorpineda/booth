import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { type PublicProduct } from '@booth/shared';

import { Badge } from '../../../components/ui/badge';
import { QuantityStepper } from '../../../components/ui/quantity-stepper';
import { fadeUp } from '../../../lib/motion';
import { type Cart, maxQuantity } from '../../cart/use-cart';
import { useStoreContext } from '../store-context';
import { AddButton } from './add-button';
import { ProductImage } from './product-image';

interface ProductCardProps {
  product: PublicProduct;
  cart: Cart;
  onOpen: (product: PublicProduct) => void;
}

/** Horizontal card on phones, vertical tile from sm up. Tapping it opens the details sheet. */
export function ProductCard({ product, cart, onOpen }: ProductCardProps) {
  const { t } = useTranslation();
  const { formatPrice } = useStoreContext();
  const quantity = cart.quantityOf(product.id);
  const lowStock = product.stockLeft !== null && product.stockLeft > 0 && product.stockLeft <= 5;

  return (
    <m.article
      variants={fadeUp}
      layout
      className="group relative flex gap-3 rounded-card bg-surface-raised p-3 shadow-card sm:flex-col sm:p-0"
    >
      <button
        type="button"
        onClick={() => {
          onOpen(product);
        }}
        className="absolute inset-0 z-0 rounded-card"
        aria-label={t('storefront.viewProduct', { name: product.name })}
      />
      <ProductImage
        image={product.images[0]}
        alt={product.name}
        sizes="(min-width: 640px) 33vw, 96px"
        className="size-24 shrink-0 rounded-control sm:aspect-[4/3] sm:size-auto sm:rounded-t-card sm:rounded-b-none"
      />
      <div className="flex min-w-0 flex-1 flex-col sm:px-4 sm:pb-4">
        <h3 className="line-clamp-2 leading-snug font-semibold">{product.name}</h3>
        {product.description ? (
          <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">{product.description}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-col items-start gap-1">
            <span className="font-bold">{formatPrice(product.priceMinor)}</span>
            {!product.available ? (
              <Badge tone="danger">{t('storefront.soldOut')}</Badge>
            ) : lowStock ? (
              <Badge tone="warning">
                {t('storefront.onlyLeft', { count: product.stockLeft ?? 0 })}
              </Badge>
            ) : null}
          </div>
          {product.available ? (
            <div className="relative z-10">
              {quantity > 0 ? (
                <QuantityStepper
                  size="sm"
                  removable
                  value={quantity}
                  max={maxQuantity(product)}
                  onChange={(value) => {
                    cart.setQuantity(product, value);
                  }}
                />
              ) : (
                <AddButton
                  productName={product.name}
                  onAdd={() => {
                    cart.add(product);
                  }}
                />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </m.article>
  );
}
