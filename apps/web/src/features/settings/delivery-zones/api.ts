import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import {
  type CreateDeliveryZoneInput,
  type DeliveryZone,
  deliveryZoneSchema,
  type UpdateDeliveryZoneInput,
} from '@booth/shared';

import { ownerApi } from '../../auth/owner-api';
import { ownerKeys, useDeliveryZones } from '../../dashboard/api';

const listSchema = z.array(deliveryZoneSchema);

export { useDeliveryZones };

/** Create, update, delete and optimistic reorder for delivery zones. */
export function useDeliveryZoneMutations() {
  const queryClient = useQueryClient();
  const key = ownerKeys.deliveryZones;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: key });
  };

  const create = useMutation({
    mutationFn: (input: CreateDeliveryZoneInput) =>
      ownerApi('/me/delivery-zones', { method: 'POST', body: input, schema: deliveryZoneSchema }),
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, ...input }: UpdateDeliveryZoneInput & { id: string }) =>
      ownerApi(`/me/delivery-zones/${id}`, {
        method: 'PATCH',
        body: input,
        schema: deliveryZoneSchema,
      }),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => ownerApi(`/me/delivery-zones/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });

  const reorder = useMutation({
    mutationFn: (ordered: DeliveryZone[]) =>
      ownerApi('/me/delivery-zones/order', {
        method: 'PUT',
        body: { ids: ordered.map((zone) => zone.id) },
        schema: listSchema,
      }),
    onMutate: async (ordered) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<DeliveryZone[]>(key);
      queryClient.setQueryData(key, ordered);
      return { previous };
    },
    onError: (_error, _ordered, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSuccess: (zones) => {
      queryClient.setQueryData(key, zones);
    },
  });

  return { create, update, remove, reorder };
}
