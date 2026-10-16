import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { type Tracking, trackingSchema } from '@booth/shared';

import { api, ApiError, apiUrl, toApiError } from '../../lib/api-client';

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

/** XHR instead of fetch: fetch cannot report upload progress yet. */
function uploadWithProgress(
  token: string,
  file: File,
  onProgress: (ratio: number) => void,
): Promise<Tracking> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl(`${trackingPath(token)}/receipt`));
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onerror = () => {
      reject(new ApiError(0, 'NETWORK_ERROR', 'Network error'));
    };
    xhr.onload = () => {
      let payload: unknown = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        // handled below
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(trackingSchema.parse(payload));
      else reject(toApiError(xhr.status, payload));
    };
    const body = new FormData();
    body.append('file', file);
    xhr.send(body);
  });
}

export function useUploadReceipt(token: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const mutation = useMutation({
    mutationFn: (file: File) => {
      setProgress(0);
      return uploadWithProgress(token, file, setProgress);
    },
    onSuccess: (tracking) => {
      queryClient.setQueryData(trackingKey(token), tracking);
    },
  });
  return { ...mutation, progress };
}
