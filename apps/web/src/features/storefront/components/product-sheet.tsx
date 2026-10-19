import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type PublicProduct } from '@booth/shared';

import { Button } from '../../../components/ui/button';
import { QuantityStepper } from '../../../components/ui/quantity-stepper';
import { Sheet } from '../../../components/ui/sheet';
import { type Cart, maxQuantity } from '../../cart/use-cart';
import { useStoreContext } from '../store-context';
import { ProductImage } from './product-image';

interface ProductSheetProps {
  product: PublicProduct | null;
  cart: Cart;
  onClose: () => void;
}

/** Product details with a swipeable gallery and an "add N for ₡X" action. */
export function ProductSheet({ product, cart, onClose }: ProductSheetProps) {
  return (
    <Sheet
      open={product !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={product?.name ?? ''}
      footer={
        product?.available ? (
          <AddToCart key={product.id} product={product} cart={cart} onDone={onClose} />
        ) : null
      }
    >
      {product ? <ProductDetails product={product} /> : null}
    </Sheet>
  );
}

function ProductDetails({ product }: { product: PublicProduct }) {
  const { t } = useTranslation();
  const { formatPrice } = useStoreContext();
  const images = product.images.length > 0 ? product.images : [undefined];

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-5 flex snap-x snap-mandatory scrollbar-none gap-3 overflow-x-auto px-5">
        {images.map((image, index) => (
          <ProductImage
            key={image?.id ?? 'placeholder'}
            image={image}
            alt={product.name}
            sizes="(min-width: 768px) 400px, 90vw"
            priority={index === 0}
            className="aspect-[4/3] w-[85%] shrink-0 snap-center rounded-card first:w-full last:w-full"
          />
        ))}
      </div>
      <p className="text-xl font-bold">{formatPrice(product.priceMinor)}</p>
      {product.description ? (
        <p className="whitespace-pre-line text-ink-muted">{product.description}</p>
      ) : null}
      {product.stockLeft !== null ? (
        <p className="text-sm text-ink-subtle">
          {product.available
            ? t('storefront.inStock', { count: product.stockLeft })
            : t('storefront.soldOut')}
        </p>
      ) : null}
    </div>
  );
}

function AddToCart({
  product,
  cart,
  onDone,
}: {
  product: PublicProduct;
  cart: Cart;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { formatPrice } = useStoreContext();
  const max = maxQuantity(product);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex items-center gap-3">
      <QuantityStepper value={quantity} onChange={setQuantity} max={max} />
      <Button
        size="lg"
        block
        onClick={() => {
          cart.add(product, quantity);
          onDone();
        }}
      >
        {t('cart.addFor', { price: formatPrice(product.priceMinor * quantity) })}
      </Button>
    </div>
  );
}
