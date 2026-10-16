import { m } from 'motion/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router';

import { ErrorState } from '../components/feedback/error-state';
import { WakingNotice } from '../components/feedback/waking-notice';
import { LanguageSwitch } from '../components/layout/language-switch';
import { Skeleton } from '../components/ui/skeleton';
import { useCartStore } from '../features/cart/cart-store';
import { useTrackingQuery } from '../features/tracking/api';
import { ClosedOrderBanner } from '../features/tracking/components/closed-order-banner';
import { ExpiryCountdown } from '../features/tracking/components/expiry-countdown';
import { OrderLines } from '../features/tracking/components/order-lines';
import { PaymentInstructions } from '../features/tracking/components/payment-instructions';
import { PlacedHero } from '../features/tracking/components/placed-hero';
import { ReceiptUpload } from '../features/tracking/components/receipt-upload';
import { StatusTimeline } from '../features/tracking/components/status-timeline';
import { TrackingProvider } from '../features/tracking/tracking-context';
import { useNow } from '../hooks/use-now';
import { applyStoreLocale } from '../lib/i18n';
import { staggerChildren } from '../lib/motion';
import { useStoreTheme } from '../lib/theme';

const RESEND_WINDOW_MS = 60 * 60 * 1000;

export function TrackingPage() {
  const { t } = useTranslation();
  const { token = '' } = useParams();
  const location = useLocation();
  const tracking = useTrackingQuery(token);
  const lastOrders = useCartStore((state) => state.lastOrders);
  const now = useNow();
  useStoreTheme(tracking.data?.store.brandColor, tracking.data?.store.brandForeground);

  useEffect(() => {
    if (tracking.data) applyStoreLocale(tracking.data.store.locale);
  }, [tracking.data]);

  if (tracking.error)
    return <ErrorState error={tracking.error} onRetry={() => void tracking.refetch()} />;
  if (!tracking.data) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-16">
        <WakingNotice loading />
        <Skeleton className="h-48 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }

  const order = tracking.data;
  const remembered = Object.values(lastOrders).find((last) => last.trackingToken === token);
  const justPlaced = (location.state as { justPlaced?: boolean } | null)?.justPlaced === true;
  const recent = remembered && now - new Date(remembered.placedAt).getTime() < RESEND_WINDOW_MS;
  const showWhatsApp = remembered && order.status === 'PENDING' && (justPlaced || recent);

  return (
    <div className="min-h-dvh pb-16">
      <title>{`${t('tracking.title', { code: order.code })} · ${order.store.name}`}</title>
      <meta name="robots" content="noindex" />
      <TrackingProvider token={token} order={order}>
        <header className="mx-auto flex max-w-xl items-center justify-between px-4 py-4">
          <Link to={`/s/${order.store.slug}`} className="font-bold">
            {order.store.name}
          </Link>
          <LanguageSwitch />
        </header>
        <m.main
          variants={staggerChildren(0.08)}
          initial="hidden"
          animate="visible"
          className="mx-auto flex max-w-xl flex-col gap-4 px-4"
        >
          {showWhatsApp ? (
            <PlacedHero whatsappUrl={remembered.whatsappUrl} />
          ) : (
            <h1 className="text-2xl font-extrabold tracking-tight">
              {t('tracking.title', { code: order.code })}
            </h1>
          )}
          <ClosedOrderBanner />
          <ExpiryCountdown />
          <StatusTimeline />
          {order.status !== 'CANCELLED' && order.status !== 'EXPIRED' ? (
            <>
              <PaymentInstructions />
              <ReceiptUpload />
            </>
          ) : null}
          <OrderLines />
        </m.main>
      </TrackingProvider>
    </div>
  );
}
