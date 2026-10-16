import { MessageCircle } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { SuccessCheck } from '../../../components/illustrations/success-check';
import { buttonVariants } from '../../../components/ui/button';
import { fadeUp, staggerChildren } from '../../../lib/motion';
import { useTracking } from '../tracking-context';

/**
 * Shown right after checkout. The order is already saved, but the store only hears about it when
 * the customer sends the WhatsApp message, so that is the one big action here.
 */
export function PlacedHero({ whatsappUrl }: { whatsappUrl: string }) {
  const { t } = useTranslation();
  const { order } = useTracking();

  return (
    <m.section
      variants={staggerChildren(0.12)}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center rounded-card bg-surface-raised px-5 py-8 text-center shadow-card"
    >
      <SuccessCheck />
      <m.h1 variants={fadeUp} className="mt-4 text-2xl font-extrabold tracking-tight">
        {t('tracking.placedTitle')}
      </m.h1>
      <m.p variants={fadeUp} className="mt-1 text-ink-muted">
        {t('tracking.placedDescription', { code: order.code })}
      </m.p>
      <m.a
        variants={fadeUp}
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileTap={{ scale: 0.97 }}
        className={buttonVariants({
          size: 'lg',
          block: true,
          className: 'mt-6 max-w-sm bg-[#25D366] text-black hover:brightness-95',
        })}
      >
        <MessageCircle className="size-5" />
        {t('tracking.sendWhatsapp')}
      </m.a>
      <m.p variants={fadeUp} className="mt-3 text-xs text-ink-subtle">
        {t('tracking.whatsappHint')}
      </m.p>
    </m.section>
  );
}
