import { Cake, Croissant, Plus, ShoppingBag, Wheat } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { spring } from '../../../../lib/motion';
import { useSampleMoney } from '../../use-sample-money';

/** Step 1: the customer adds products; the bag counter bumps. */
export function CatalogScene() {
  const { t } = useTranslation();
  const money = useSampleMoney();
  const products = [
    { name: t('home.flow.product1'), price: money(6), icon: Wheat },
    { name: t('home.flow.product2'), price: money(5), icon: Cake },
    { name: t('home.flow.product3'), price: money(4), icon: Croissant },
  ];

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{t('home.flow.store')}</p>
        <span className="relative grid size-9 place-items-center rounded-full bg-surface-sunken">
          <ShoppingBag className="size-4" />
          <m.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...spring.bouncy, delay: 1.4 }}
            className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-brand text-[0.65rem] font-bold text-brand-foreground"
          >
            2
          </m.span>
        </span>
      </div>
      {products.map((product, index) => (
        <m.div
          key={product.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: index * 0.12 }}
          className="flex items-center gap-3 rounded-xl border border-line p-2"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface-sunken text-ink-muted">
            <product.icon className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{product.name}</span>
            <span className="text-xs text-ink-muted tabular-nums">{product.price}</span>
          </span>
          <m.span
            animate={index < 2 ? { scale: [1, 0.85, 1] } : {}}
            transition={{ delay: 0.7 + index * 0.4, duration: 0.3 }}
            className="grid size-7 place-items-center rounded-full bg-brand text-brand-foreground"
          >
            <Plus className="size-3.5" />
          </m.span>
        </m.div>
      ))}
      {/* The bag bar the storefront shows once something is added. */}
      <m.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.gentle, delay: 1.5 }}
        className="mt-auto flex items-center justify-between rounded-full bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground"
      >
        <span>{t('home.flow.viewOrder')}</span>
        <span className="tabular-nums">{money(17)}</span>
      </m.div>
    </div>
  );
}
