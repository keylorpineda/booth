import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { type Product, type ProductImage, productImageSchema } from '@booth/shared';

import { productKeys } from './api';
import { ownerApi } from '../../auth/owner-api';
import { ownerUpload } from '../../auth/owner-upload';

const detailKey = (productId: string) => [...productKeys.all, 'detail', productId];

/** Photo mutations for one product; each keeps the cached product (and its list) in sync. */
export function useProductImages(productId: string) {
  const queryClient = useQueryClient();
  const path = `/me/products/${encodeURIComponent(productId)}/images`;
  const [progress, setProgress] = useState<{ done: number; total: number; ratio: number }>();

  const setImages = (update: (images: ProductImage[]) => ProductImage[]) => {
    queryClient.setQueryData<Product>(detailKey(productId), (product) =>
      product ? { ...product, images: update(product.images) } : product,
    );
  };
  const refreshLists = () => {
    void queryClient.invalidateQueries({ queryKey: [...productKeys.all, 'list'] });
  };

  /** Several files, one after another (one request each), with overall progress. */
  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      for (const [index, file] of files.entries()) {
        setProgress({ done: index, total: files.length, ratio: 0 });
        const image = await ownerUpload(path, file, {
          schema: productImageSchema,
          onProgress: (ratio) => {
            setProgress({ done: index, total: files.length, ratio });
          },
        });
        setImages((images) => [...images, image]);
      }
    },
    onSettled: () => {
      setProgress(undefined);
      refreshLists();
    },
  });

  const remove = useMutation({
    mutationFn: (imageId: string) => ownerApi(`${path}/${imageId}`, { method: 'DELETE' }),
    onSuccess: (_result, imageId) => {
      setImages((images) => images.filter((image) => image.id !== imageId));
      refreshLists();
    },
  });

  /** Optimistic: the gallery moves at once; the first image is the storefront cover. */
  const reorder = useMutation({
    mutationFn: (ordered: ProductImage[]) =>
      ownerApi(`${path}/order`, { method: 'PUT', body: { ids: ordered.map((image) => image.id) } }),
    onMutate: (ordered) => {
      const previous = queryClient.getQueryData<Product>(detailKey(productId))?.images;
      setImages(() => ordered);
      return { previous };
    },
    onError: (_error, _ordered, context) => {
      if (context?.previous) setImages(() => context.previous ?? []);
    },
    onSuccess: refreshLists,
  });

  return { upload, remove, reorder, progress };
}
