import { type Product } from '@booth/shared';

/** At or below this many units a tracked product shows a "low stock" badge. */
export const LOW_STOCK = 5;

export type ProductBadge = 'inactive' | 'soldOut' | 'lowStock';

/** Badges that need the owner's attention, most important first. */
export function productBadges(
  product: Pick<Product, 'isActive' | 'trackStock' | 'stock'>,
): ProductBadge[] {
  const badges: ProductBadge[] = [];
  if (!product.isActive) badges.push('inactive');
  if (product.trackStock && product.stock === 0) badges.push('soldOut');
  else if (product.trackStock && product.stock <= LOW_STOCK) badges.push('lowStock');
  return badges;
}
