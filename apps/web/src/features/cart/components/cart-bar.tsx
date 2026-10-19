import { ShoppingBag } from 'lucide-react';
import { AnimatePresence, m, useAnimationControls } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { AnimatedNumber } from '../../../components/motion/animated-number';
import { spring } from '../../../lib/motion';
import { useStoreContext } from '../../storefront/store-context';

interface CartBarProps {
  count: number;
  subtotalMinor: number;
  onOpen: () => void;
}

/** Floating "view cart" bar within thumb reach. The bag bumps every time the count goes up. */
export function CartBar({ count, subtotalMinor, onOpen }: CartBarProps) {
  const { t } = useTranslation();
  const { formatPrice } = useStoreContext();
  const bag = useAnimationControls();
  const previousCountRef = useRef(count);

  useEffect(() => {
    if (count > previousCountRef.current) {
      void bag.start({
        scale: [1, 1.3, 1],
        rotate: [0, -12, 8, 0],
        transition: { duration: 0.45 },
      });
    }
    previousCountRef.current = count;
  }, [count, bag]);

  return (
    <AnimatePresence>
      {count > 0 ? (
        <m.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={spring.gentle}
          className="pb-safe fixed inset-x-0 bottom-0 z-30 px-4"
        >
          <m.button
            type="button"
            onClick={onOpen}
            whileTap={{ scale: 0.98 }}
            className="mx-auto flex h-16 w-full max-w-md items-center gap-3 rounded-full bg-brand px-3 pr-6 text-brand-foreground shadow-float"
          >
            <m.span
              animate={bag}
              className="relative grid size-11 place-items-center rounded-full bg-black/10"
            >
              <ShoppingBag className="size-5" />
              <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-ink px-1 text-xs font-bold text-surface">
                <AnimatedNumber value={count} />
              </span>
            </m.span>
            <span className="flex-1 text-left font-semibold">{t('cart.view')}</span>
            <span className="font-bold tabular-nums">{formatPrice(subtotalMinor)}</span>
          </m.button>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
