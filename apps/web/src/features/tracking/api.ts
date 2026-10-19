import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { trackingSchema } from '@booth/shared';

import { api } from '../../lib/api-client';
import { uploadFile } from '../../lib/upload';

const trackingKey = (token: string) => ['tracking', token] as const;
const trackingPath = (token: string) => `/public/orders/${encodeURIComponent(token)}`;

const ACTIVE = new Set(['PENDING', 'CONFIRMED', 'PREPARING', 'READY']);

/** Polls while the order is still moving, so status changes appear without reloading. */
export function useTrackingQuery(token: string) {
  return useQuery({
    queryKey: trackingKey(token),
    queryFn: ({ signal }) => api(trackingPath(token), { schema: trackingSchema, signal }),
    refetchInterval: (query) =>
      query.state.data && ACTIVE.has(query.state.data.status) ? 20_000 : false,
    refetchOnWindowFocus: true,
  });
}

export function useUploadReceipt(token: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const mutation = useMutation({
    mutationFn: (file: File) => {
      setProgress(0);
      return uploadFile(`${trackingPath(token)}/receipt`, file, {
        schema: trackingSchema,
        onProgress: setProgress,
      });
    },
    onSuccess: (tracking) => {
      queryClient.setQueryData(trackingKey(token), tracking);
    },
  });
  return { ...mutation, progress };
}
