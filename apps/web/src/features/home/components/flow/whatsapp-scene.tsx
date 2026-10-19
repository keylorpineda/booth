import { CheckCheck } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { spring } from '../../../../lib/motion';
import { useSampleMoney } from '../../use-sample-money';

/** Step 2: the complete order lands in the store's WhatsApp chat. */
export function WhatsappScene() {
  const { t } = useTranslation();
  const money = useSampleMoney();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="grid size-8 place-items-center rounded-full bg-[#25D366] text-xs font-bold text-black">
          LE
        </span>
        <p className="text-sm font-semibold">{t('home.flow.store')}</p>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-2 bg-surface-sunken p-3">
        <m.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...spring.gentle, delay: 0.3 }}
          className="ml-auto w-[88%] rounded-2xl rounded-br-sm bg-[#d9fdd3] p-3 text-sm text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]"
        >
          <p className="font-semibold">{t('home.flow.order')} #K7Q2MX</p>
          <p className="mt-1">2 × {t('home.flow.product1')}</p>
          <p>1 × {t('home.flow.product2')}</p>
          <p className="mt-1 font-semibold tabular-nums">
            {t('home.flow.total')}: {money(17)}
          </p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[0.65rem] opacity-70">
            10:24 <CheckCheck className="size-3.5 text-sky-500" />
          </p>
        </m.div>
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.3 }}
          className="w-fit max-w-[80%] rounded-2xl rounded-bl-sm bg-surface-raised p-3 text-sm shadow-card"
        >
          {t('home.flow.reply')}
        </m.div>
      </div>
    </div>
  );
}
