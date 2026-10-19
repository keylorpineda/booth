import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { m } from 'motion/react';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { type PublicCatalog, type QuoteRequest } from '@booth/shared';

import { useErrorMessage } from '../../../hooks/use-error-message';
import { staggerChildren } from '../../../lib/motion';
import { useCartStore } from '../../cart/cart-store';
import { useCart } from '../../cart/use-cart';
import { storefrontKeys } from '../../storefront/api';
import { useStoreContext } from '../../storefront/store-context';
import { usePlaceOrderMutation, useQuoteQuery } from '../api';
import { CASH, type CheckoutForm, checkoutFormSchema, toOrderInput } from '../checkout-form';
import { ContactSection } from './contact-section';
import { FulfillmentSection } from './fulfillment-section';
import { OrderSummary } from './order-summary';
import { PaymentSection } from './payment-section';
import { PlaceOrderBar } from './place-order-bar';
import { PrivacyConsent } from './privacy-consent';

export function CheckoutView({ catalog }: { catalog: PublicCatalog }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const { slug, store } = useStoreContext();
  const cart = useCart(slug, catalog);
  const rememberOrder = useCartStore((state) => state.rememberOrder);
  const placeOrder = usePlaceOrderMutation(slug);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutFormSchema(store.country)),
    defaultValues: {
      name: '',
      phone: '',
      note: '',
      fulfillment: store.fulfillment.pickup.enabled ? 'PICKUP' : 'DELIVERY',
      deliveryZoneId: '',
      deliveryAddress: '',
      payment: store.payment.transfer[0]?.id ?? (store.payment.cash ? CASH : ''),
      privacyConsent: false,
    },
  });
  const [fulfillment, deliveryZoneId] = useWatch({
    control: form.control,
    name: ['fulfillment', 'deliveryZoneId'],
  });

  const quoteRequest = useMemo<QuoteRequest>(
    () => ({
      items: cart.lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      fulfillment,
      deliveryZoneId: fulfillment === 'DELIVERY' && deliveryZoneId ? deliveryZoneId : null,
    }),
    [cart.lines, fulfillment, deliveryZoneId],
  );
  // Before a zone is chosen, quote as pickup so the customer still sees the subtotal.
  const quote = useQuoteQuery(
    slug,
    quoteRequest.fulfillment === 'DELIVERY' && !quoteRequest.deliveryZoneId
      ? { ...quoteRequest, fulfillment: 'PICKUP' }
      : quoteRequest,
  );

  if (cart.lines.length === 0 && !placeOrder.isSuccess)
    return <Navigate to={`/s/${slug}`} replace />;

  const onSubmit = form.handleSubmit((values) => {
    placeOrder.mutate(toOrderInput(values, cart.lines, store.country, i18n.language), {
      onSuccess: (order) => {
        rememberOrder(slug, {
          code: order.code,
          trackingToken: order.trackingToken,
          whatsappUrl: order.whatsappUrl,
          totalMinor: order.totalMinor,
          placedAt: new Date().toISOString(),
        });
        cart.clear();
        void queryClient.invalidateQueries({ queryKey: storefrontKeys.catalog(slug) });
        void navigate(`/t/${order.trackingToken}`, { state: { justPlaced: true } });
      },
      onError: (error) => {
        toast.error(errorMessage(error));
        void queryClient.invalidateQueries({ queryKey: storefrontKeys.catalog(slug) });
      },
    });
  });

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      noValidate
      className="mx-auto max-w-2xl px-4 pt-4 pb-40"
    >
      <Link
        to={`/s/${slug}`}
        className="inline-flex items-center gap-1.5 py-2 text-sm font-semibold text-ink-muted"
      >
        <ArrowLeft className="size-4" />
        {store.name}
      </Link>
      <h1 className="mb-4 text-2xl font-extrabold tracking-tight">{t('checkout.title')}</h1>
      <m.div
        variants={staggerChildren(0.06)}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4"
      >
        <ContactSection form={form} />
        <FulfillmentSection form={form} />
        <PaymentSection form={form} />
        <OrderSummary quote={quote.data} loading={quote.isFetching} />
        <PrivacyConsent form={form} />
      </m.div>
      <PlaceOrderBar total={quote.data?.totalMinor} submitting={placeOrder.isPending} />
    </form>
  );
}
