import { type PrismaService } from '../../src/prisma/prisma.service';

export interface Storefront {
  storeId: string;
  slug: string;
  /** Tracked, 5 in stock, ₡2 500. */
  breadId: string;
  /** Made to order (not tracked), ₡1 500. */
  coffeeId: string;
  /** Tracked, 1 in stock, ₡10 000. */
  cakeId: string;
  zoneId: string;
  sinpeId: string;
}

/**
 * Seeds a sellable store directly in the database (the owner endpoints for zones and payment
 * methods arrive in Phase 6): products, a delivery zone, a transfer method, delivery and cash on.
 */
export async function seedStorefront(prisma: PrismaService, storeId: string): Promise<Storefront> {
  const store = await prisma.store.update({
    where: { id: storeId },
    data: { deliveryEnabled: true, pickupEnabled: true, cashEnabled: true },
  });
  const category = await prisma.category.create({ data: { storeId, name: 'Panadería' } });
  const product = (
    name: string,
    priceMinor: bigint,
    trackStock: boolean,
    stock: number,
    position: number,
  ) =>
    prisma.product.create({
      data: { storeId, categoryId: category.id, name, priceMinor, trackStock, stock, position },
    });

  const bread = await product('Pan de ajo', 250000n, true, 5, 0);
  const coffee = await product('Café chorreado', 150000n, false, 0, 1);
  const cake = await product('Queque', 1000000n, true, 1, 2);
  const zone = await prisma.deliveryZone.create({
    data: { storeId, name: 'Centro', feeMinor: 150000n },
  });
  const sinpe = await prisma.paymentMethod.create({
    data: {
      storeId,
      kind: 'TRANSFER',
      preset: 'SINPE_MOVIL',
      label: 'SINPE Móvil',
      accountHolder: 'Panadería La Esquina',
      accountIdentifier: '8888-7777',
      instructions: 'Use el código del pedido como referencia',
    },
  });

  return {
    storeId,
    slug: store.slug,
    breadId: bread.id,
    coffeeId: coffee.id,
    cakeId: cake.id,
    zoneId: zone.id,
    sinpeId: sinpe.id,
  };
}

/** A valid order body; override what each test needs. */
export function orderBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    items: [],
    fulfillment: 'PICKUP',
    payment: { type: 'CASH' },
    customer: { name: 'Ana', phone: '+50677776666' },
    privacyConsent: true,
    ...overrides,
  };
}
