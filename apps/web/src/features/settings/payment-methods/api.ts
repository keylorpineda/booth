import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import {
  type CreatePaymentMethodInput,
  type PaymentMethod,
  paymentMethodSchema,
  type UpdatePaymentMethodInput,
} from '@booth/shared';

import { ownerApi } from '../../auth/owner-api';
import { ownerKeys, usePaymentMethods } from '../../dashboard/api';

const listSchema = z.array(paymentMethodSchema);

export { usePaymentMethods };

/** Create, update, delete and optimistic reorder for transfer payment methods. */
export function usePaymentMethodMutations() {
  const queryClient = useQueryClient();
  const key = ownerKeys.paymentMethods;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: key });
  };

  const create = useMutation({
    mutationFn: (input: CreatePaymentMethodInput) =>
      ownerApi('/me/payment-methods', { method: 'POST', body: input, schema: paymentMethodSchema }),
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, ...input }: UpdatePaymentMethodInput & { id: string }) =>
      ownerApi(`/me/payment-methods/${id}`, {
        method: 'PATCH',
        body: input,
        schema: paymentMethodSchema,
      }),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => ownerApi(`/me/payment-methods/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });

  const reorder = useMutation({
    mutationFn: (ordered: PaymentMethod[]) =>
      ownerApi('/me/payment-methods/order', {
        method: 'PUT',
        body: { ids: ordered.map((method) => method.id) },
        schema: listSchema,
      }),
    onMutate: async (ordered) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PaymentMethod[]>(key);
      queryClient.setQueryData(key, ordered);
      return { previous };
    },
    onError: (_error, _ordered, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSuccess: (methods) => {
      queryClient.setQueryData(key, methods);
    },
  });

  return { create, update, remove, reorder };
}
