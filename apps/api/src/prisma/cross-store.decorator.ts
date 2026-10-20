import { SetMetadata } from '@nestjs/common';

export const CROSS_STORE = 'booth:crossStore';

/**
 * Marks an owner route whose whole purpose is to look beyond the caller's store (for example,
 * checking whether a slug is free across all stores). It runs without the store-scoped transaction,
 * so row-level security does not hide other stores. Keep these routes read-only and rare.
 */
export const CrossStore = () => SetMetadata(CROSS_STORE, true);
