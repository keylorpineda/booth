import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  type OrderStatus,
  type OwnerOrder,
  ownerOrderSchema,
  receiptUrlSchema,
} from '@booth/shared';

import { orderKeys } from './api';
import { ownerApi } from '../auth/owner-api';

/**
 * Order mutations. The API answers with the updated order: it goes straight into the detail cache
 * and the lists refetch, so badges and tabs follow without a reload.
 */
export function useOrderActions(id: string) {
  const queryClient = useQueryClient();
  const path = `/me/orders/${encodeURIComponent(id)}`;
  const onSuccess = (order: OwnerOrder) => {
    queryClient.setQueryData(orderKeys.detail(id), order);
    void queryClient.invalidateQueries({ queryKey: [...orderKeys.all, 'list'] });
  };

  const changeStatus = useMutation({
    mutationFn: (status: OrderStatus) =>
      ownerApi(`${path}/status`, { method: 'PATCH', body: { status }, schema: ownerOrderSchema }),
    onSuccess,
  });

  const setPayment = useMutation({
    mutationFn: (paymentStatus: 'PAID' | 'UNPAID') =>
      ownerApi(`${path}/payment`, {
        method: 'PATCH',
        body: { paymentStatus },
        schema: ownerOrderSchema,
      }),
    onSuccess,
  });

  const reactivate = useMutation({
    mutationFn: () => ownerApi(`${path}/reactivate`, { method: 'POST', schema: ownerOrderSchema }),
    onSuccess,
  });

  /** Short-lived signed link to the private receipt (never cached: it expires in minutes). */
  const receiptUrl = useMutation({
    mutationFn: () => ownerApi(`${path}/receipt-url`, { schema: receiptUrlSchema }),
  });

  return { changeStatus, setPayment, reactivate, receiptUrl };
}
