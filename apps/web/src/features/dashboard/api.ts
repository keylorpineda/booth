import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import {
  businessHourSchema,
  deliveryZoneSchema,
  paginatedSchema,
  paymentMethodSchema,
  productSchema,
  storeSchema,
} from '@booth/shared';

import { ownerApi } from '../auth/owner-api';

/** Owner queries live under ['owner', ...]: signing out removes them all at once. */
export const ownerKeys = {
  store: ['owner', 'store'] as const,
  productsSample: ['owner', 'products', 'sample'] as const,
  paymentMethods: ['owner', 'payment-methods'] as const,
  businessHours: ['owner', 'business-hours'] as const,
  deliveryZones: ['owner', 'delivery-zones'] as const,
};

export const useOwnerStore = () =>
  useQuery({
    queryKey: ownerKeys.store,
    queryFn: ({ signal }) => ownerApi('/me/store', { schema: storeSchema, signal }),
  });

/** One product is enough to know whether the catalog is empty. */
export const useHasProducts = () =>
  useQuery({
    queryKey: ownerKeys.productsSample,
    queryFn: ({ signal }) =>
      ownerApi('/me/products?limit=1', { schema: paginatedSchema(productSchema), signal }),
    select: (page) => page.data.length > 0,
  });

export const usePaymentMethods = () =>
  useQuery({
    queryKey: ownerKeys.paymentMethods,
    queryFn: ({ signal }) =>
      ownerApi('/me/payment-methods', { schema: z.array(paymentMethodSchema), signal }),
  });

export const useBusinessHours = () =>
  useQuery({
    queryKey: ownerKeys.businessHours,
    queryFn: ({ signal }) =>
      ownerApi('/me/business-hours', { schema: z.array(businessHourSchema), signal }),
  });

export const useDeliveryZones = () =>
  useQuery({
    queryKey: ownerKeys.deliveryZones,
    queryFn: ({ signal }) =>
      ownerApi('/me/delivery-zones', { schema: z.array(deliveryZoneSchema), signal }),
  });
