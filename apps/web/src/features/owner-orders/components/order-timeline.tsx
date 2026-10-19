import { History } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { type OwnerOrder } from '@booth/shared';

import { DetailCard } from './detail-card';
import { fadeUp, staggerChildren } from '../../../lib/motion';

/** Notes the API writes itself, shown in the interface language. */
const SYSTEM_NOTES: Record<string, string> = { Reactivated: 'orders.timeline.reactivatedNote' };

/** Every status change, oldest first, with who made it. */
export function OrderTimeline({ order }: { order: OwnerOrder }) {
  const { t, i18n } = useTranslation();
  const time = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <DetailCard title={t('orders.detail.timeline')} icon={History}>
      <m.ol
        variants={staggerChildren(0.05)}
        initial="hidden"
        animate="visible"
        className="relative ml-1.5 border-l-2 border-line"
      >
        {order.events.map((event, index) => {
          const last = index === order.events.length - 1;
          const note = event.note ? (SYSTEM_NOTES[event.note] ?? null) : null;
          return (
            <m.li
              key={`${event.status}-${event.at}`}
              variants={fadeUp}
              className="relative pb-4 pl-5 last:pb-0"
            >
              <span
                aria-hidden="true"
                className={`absolute top-1 -left-[7px] size-3 rounded-full ring-4 ring-surface-raised ${last ? 'bg-brand' : 'bg-line-strong'}`}
              />
              <p className="font-semibold">{t(`orders.status.${event.status}`)}</p>
              <p className="text-sm text-ink-muted">
                <time dateTime={event.at}>{time.format(new Date(event.at))}</time>
                {' · '}
                {t(`orders.timeline.actor.${event.actor}`, { defaultValue: event.actor })}
              </p>
              {event.note ? (
                <p className="mt-1 text-sm whitespace-pre-line">{note ? t(note) : event.note}</p>
              ) : null}
            </m.li>
          );
        })}
      </m.ol>
    </DetailCard>
  );
}
