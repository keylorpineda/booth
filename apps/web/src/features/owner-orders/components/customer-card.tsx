import { MessageCircle, Phone, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { toWhatsAppNumber, type OwnerOrder } from '@booth/shared';

import { DetailCard } from './detail-card';
import { buttonVariants } from '../../../components/ui/button';
import { cn } from '../../../lib/cn';

/** Who ordered, with one tap to write or call them. */
export function CustomerCard({ order }: { order: OwnerOrder }) {
  const { t } = useTranslation();
  const greeting = encodeURIComponent(t('orders.detail.whatsappGreeting', { code: order.code }));

  return (
    <DetailCard title={t('orders.detail.customer')} icon={UserRound}>
      <p className="text-lg font-semibold">{order.customerName}</p>
      <p className="text-ink-muted tabular-nums">{order.customerPhone}</p>
      {order.customerNote ? (
        <blockquote className="mt-3 rounded-control border-l-4 border-brand bg-brand-soft px-3 py-2 text-sm whitespace-pre-line">
          {order.customerNote}
        </blockquote>
      ) : null}
      <div className="mt-4 flex gap-2">
        <a
          href={`https://wa.me/${toWhatsAppNumber(order.customerPhone)}?text=${greeting}`}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ size: 'sm' }), 'flex-1 bg-[#25D366] text-black')}
        >
          <MessageCircle className="size-4" />
          {t('orders.detail.whatsapp')}
        </a>
        <a
          href={`tel:${order.customerPhone}`}
          className={buttonVariants({ size: 'sm', variant: 'outline' })}
        >
          <Phone className="size-4" />
          {t('orders.detail.call')}
        </a>
      </div>
    </DetailCard>
  );
}
