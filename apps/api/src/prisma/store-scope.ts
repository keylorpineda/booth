import { AsyncLocalStorage } from 'node:async_hooks';

import { type Prisma } from '../generated/prisma/client';

export interface StoreScope {
  storeId: string;
  /** The owner request's transaction, running as `booth_app` with `booth.store_id` set. */
  tx: Prisma.TransactionClient;
}

/** The store scope of the current owner request, if any (see StoreScopeInterceptor). */
export const storeScope = new AsyncLocalStorage<StoreScope>();

/**
 * Opens a transaction in which Postgres row-level security only exposes `storeId`'s rows: the role
 * becomes `booth_app` (subject to the policies) and `booth.store_id` names the store. Both settings
 * end with the transaction, so the pooled connection goes back unrestricted.
 */
export async function inStoreScope<T>(
  client: {
    $transaction: <R>(
      fn: (tx: Prisma.TransactionClient) => Promise<R>,
      options?: { maxWait?: number; timeout?: number },
    ) => Promise<R>;
  },
  storeId: string,
  work: () => Promise<T>,
): Promise<T> {
  return client.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('booth.store_id', ${storeId}, true)`;
      await tx.$executeRawUnsafe('SET LOCAL ROLE booth_app');
      return storeScope.run({ storeId, tx }, work);
    },
    // Owner requests may upload images to the media service while the transaction is open.
    { maxWait: 10_000, timeout: 30_000 },
  );
}
