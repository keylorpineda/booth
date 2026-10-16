import { Check, CheckCheck } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { formatMoney } from '@booth/shared';

import { spring } from '../../../lib/motion';

/** Hero illustration: the order a customer sends, as it arrives on the store's WhatsApp. */
export function OrderPreview() {
  const { t, i18n } = useTranslation();
  // Sample order in a currency that fits the language: colones in Spanish, dollars in English.
  const [currency, unit, locale] =
    i18n.language === 'es' ? ['CRC', 50_000, 'es-CR'] : ['USD', 100, 'en-US'];
  const money = (units: number) => formatMoney(units * unit, currency, locale);
  const lines = [
    { qty: 2, name: t('home.preview.item1'), price: money(6) },
    { qty: 1, name: t('home.preview.item2'), price: money(5) },
    { qty: 4, name: t('home.preview.item3'), price: money(4) },
  ];

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div aria-hidden="true" className="absolute -inset-6 rounded-[2.5rem] bg-brand/25 blur-3xl" />
      <m.div
        initial={{ opacity: 0, y: 24, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ ...spring.gentle, delay: 0.25 }}
        className="relative rounded-[2rem] border border-line bg-surface-raised p-3 shadow-float"
      >
        <div className="flex items-center gap-3 rounded-t-[1.4rem] bg-brand px-4 py-3 text-brand-foreground">
          <span className="grid size-9 place-items-center rounded-full bg-brand-foreground/15 text-sm font-bold">
            LE
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{t('home.preview.store')}</p>
            <p className="text-xs opacity-80">{t('home.preview.online')}</p>
          </div>
        </div>
        <div className="space-y-3 rounded-b-[1.4rem] bg-surface-sunken p-4">
          <m.div
            initial={{ opacity: 0, scale: 0.9, originX: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring.bouncy, delay: 0.7 }}
            className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-surface-raised p-3 text-sm shadow-card"
          >
            <p className="font-semibold">
              {t('home.preview.order')} <span className="text-brand-ink">#K7Q2MX</span>
            </p>
            <ul className="mt-2 space-y-1 text-ink-muted">
              {lines.map((line) => (
                <li key={line.name} className="flex justify-between gap-4">
                  <span>
                    {line.qty} × {line.name}
                  </span>
                  <span className="tabular-nums">{line.price}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 flex justify-between border-t border-line pt-2 font-semibold">
              <span>{t('home.preview.total')}</span>
              <span className="tabular-nums">{money(15)}</span>
            </p>
            <p className="mt-1 flex items-center justify-end gap-1 text-[0.7rem] text-ink-subtle">
              10:24 <CheckCheck className="size-3.5 text-brand" />
            </p>
          </m.div>
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: 1.3 }}
            className="flex w-fit items-center gap-2 rounded-2xl rounded-tl-sm bg-surface-raised px-3 py-2 text-sm shadow-card"
          >
            <span className="grid size-5 place-items-center rounded-full bg-success text-white">
              <Check className="size-3" />
            </span>
            {t('home.preview.reply')}
          </m.div>
        </div>
      </m.div>
    </div>
  );
}
