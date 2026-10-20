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
 *
 * A failing request still commits what it wrote before the error (e.g. an order expired lazily
 * before a refused status change), exactly as without the scope: the transaction is a security
 * boundary, not a unit of work. Postgres itself discards the writes of a failed statement.
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
  const outcome = await client.$transaction(
    async (tx): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> => {
      await tx.$executeRaw`SELECT set_config('booth.store_id', ${storeId}, true)`;
      await tx.$executeRawUnsafe('SET LOCAL ROLE booth_app');
      try {
        return { ok: true, value: await storeScope.run({ storeId, tx }, work) };
      } catch (error) {
        return { ok: false, error };
      }
    },
    // Owner requests may upload images to the media service while the transaction is open.
    { maxWait: 10_000, timeout: 30_000 },
  );
  if (!outcome.ok) throw outcome.error;
  return outcome.value;
}
