import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { type BusinessHour, businessHourSchema } from '@booth/shared';

import { ownerApi } from '../../auth/owner-api';
import { ownerKeys, useBusinessHours } from '../../dashboard/api';

const listSchema = z.array(businessHourSchema);

export { useBusinessHours };

/** Replaces the weekly opening hours for the signed-in owner's store. */
export function useReplaceBusinessHoursMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hours: BusinessHour[]) =>
      ownerApi('/me/business-hours', {
        method: 'PUT',
        body: { hours },
        schema: listSchema,
      }),
    onSuccess: (hours) => {
      queryClient.setQueryData(ownerKeys.businessHours, hours);
    },
  });
}
