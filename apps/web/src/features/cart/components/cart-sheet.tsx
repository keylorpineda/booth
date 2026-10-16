import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { EmptyBagIllustration } from '../../../components/illustrations/empty-bag';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/empty-state';
import { Sheet } from '../../../components/ui/sheet';
import { useStoreContext } from '../../storefront/store-context';
import { type Cart } from '../use-cart';
import { CartLineItem } from './cart-line-item';

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: Cart;
}

export function CartSheet({ open, onOpenChange, cart }: CartSheetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { slug, store, formatPrice } = useStoreContext();
  const empty = cart.lines.length === 0;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('cart.title')}
      description={store.name}
      footer={
        empty ? null : (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-ink-muted">{t('cart.subtotal')}</span>
              <span className="text-lg font-bold tabular-nums">
                {formatPrice(cart.subtotalMinor)}
              </span>
            </div>
            <Button
              size="lg"
              block
              disabled={!store.acceptingOrders}
              onClick={() => {
                onOpenChange(false);
                void navigate(`/s/${slug}/checkout`);
              }}
            >
              {store.acceptingOrders ? t('cart.checkout') : t('storefront.closedNoOrders')}
            </Button>
          </div>
        )
      }
    >
      {empty ? (
        <EmptyState
          illustration={<EmptyBagIllustration />}
          title={t('cart.emptyTitle')}
          description={t('cart.emptyDescription')}
        />
      ) : (
        <ul className="divide-y divide-line">
          <AnimatePresence initial={false}>
            {cart.lines.map((line) => (
              <CartLineItem key={line.product.id} line={line} cart={cart} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Sheet>
  );
}
