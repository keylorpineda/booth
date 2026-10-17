import { z } from 'zod';

import {
  MAX_ORDER_EXPIRATION_MINUTES,
  MIN_ORDER_EXPIRATION_MINUTES,
  type Store,
  type UpdateStoreInput,
} from '@booth/shared';

export const orderingFormSchema = z
  .object({
    acceptOrdersWhenClosed: z.boolean(),
    orderExpirationMinutes: z.string().trim(),
    pickupEnabled: z.boolean(),
    pickupAddress: z.string().trim().max(200, 'validation.tooLong'),
    deliveryEnabled: z.boolean(),
    cashEnabled: z.boolean(),
  })
  .superRefine((form, ctx) => {
    const minutes = Number(form.orderExpirationMinutes);
    if (
      !/^\d+$/.test(form.orderExpirationMinutes) ||
      minutes < MIN_ORDER_EXPIRATION_MINUTES ||
      minutes > MAX_ORDER_EXPIRATION_MINUTES
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['orderExpirationMinutes'],
        message: 'validation.expirationMinutes',
      });
    }
    if (!form.pickupEnabled && !form.deliveryEnabled) {
      ctx.addIssue({
        code: 'custom',
        path: ['pickupEnabled'],
        message: 'validation.fulfillmentRequired',
      });
    }
  });

export type OrderingForm = z.infer<typeof orderingFormSchema>;

export function toOrderingForm(store: Store): OrderingForm {
  return {
    acceptOrdersWhenClosed: store.acceptOrdersWhenClosed,
    orderExpirationMinutes: String(store.orderExpirationMinutes),
    pickupEnabled: store.pickupEnabled,
    pickupAddress: store.pickupAddress ?? '',
    deliveryEnabled: store.deliveryEnabled,
    cashEnabled: store.cashEnabled,
  };
}

export function toOrderingUpdate(form: OrderingForm): UpdateStoreInput {
  return {
    acceptOrdersWhenClosed: form.acceptOrdersWhenClosed,
    orderExpirationMinutes: Number(form.orderExpirationMinutes),
    pickupEnabled: form.pickupEnabled,
    pickupAddress: form.pickupAddress === '' ? null : form.pickupAddress,
    deliveryEnabled: form.deliveryEnabled,
    cashEnabled: form.cashEnabled,
  };
}
