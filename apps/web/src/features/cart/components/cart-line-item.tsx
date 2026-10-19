import { m } from 'motion/react';

import { QuantityStepper } from '../../../components/ui/quantity-stepper';
import { spring } from '../../../lib/motion';
import { ProductImage } from '../../storefront/components/product-image';
import { useStoreContext } from '../../storefront/store-context';
import { type Cart, type CartLine, maxQuantity } from '../use-cart';

/** One cart row; it collapses smoothly when removed. */
export function CartLineItem({ line, cart }: { line: CartLine; cart: Cart }) {
  const { formatPrice } = useStoreContext();

  return (
    <m.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, x: -40 }}
      transition={spring.gentle}
      className="flex items-center gap-3 overflow-hidden py-3"
    >
      <ProductImage
        image={line.product.images[0]}
        alt={line.product.name}
        sizes="56px"
        className="size-14 shrink-0 rounded-control"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{line.product.name}</p>
        <p className="text-sm text-ink-muted tabular-nums">{formatPrice(line.lineTotalMinor)}</p>
      </div>
      <QuantityStepper
        size="sm"
        removable
        value={line.quantity}
        max={maxQuantity(line.product)}
        onChange={(value) => {
          cart.setQuantity(line.product, value);
        }}
      />
    </m.li>
  );
}
