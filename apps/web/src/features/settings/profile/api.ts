import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { type Store, type StoreImageKind, storeSchema, type UpdateStoreInput } from '@booth/shared';

import { ownerApi } from '../../auth/owner-api';
import { ownerUpload } from '../../auth/owner-upload';
import { ownerKeys } from '../../dashboard/api';

/** Updates the owner's store settings and keeps the cached store in sync. */
export function useUpdateStoreMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStoreInput) =>
      ownerApi('/me/store', { method: 'PATCH', body: input, schema: storeSchema }),
    onSuccess: (store) => {
      queryClient.setQueryData<Store>(ownerKeys.store, store);
    },
  });
}

/** Uploads or removes the store logo or cover image, with upload progress. */
export function useStoreImageMutation(kind: StoreImageKind) {
  const queryClient = useQueryClient();
  const path = `/me/store/${kind}`;
  const [progress, setProgress] = useState<number>();

  const setStore = (store: Store) => {
    queryClient.setQueryData<Store>(ownerKeys.store, store);
  };

  const upload = useMutation({
    mutationFn: (file: File) => {
      setProgress(0);
      return ownerUpload(path, file, { schema: storeSchema, onProgress: setProgress });
    },
    onSuccess: setStore,
    onSettled: () => {
      setProgress(undefined);
    },
  });

  const remove = useMutation({
    mutationFn: () => ownerApi(path, { method: 'DELETE', schema: storeSchema }),
    onSuccess: setStore,
  });

  return { upload, remove, progress };
}
