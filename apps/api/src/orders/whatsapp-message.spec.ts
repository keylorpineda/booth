import { buildOrderMessage, type OrderMessageInput, whatsappUrl } from './whatsapp-message';

const order: OrderMessageInput = {
  locale: 'es',
  country: 'CR',
  currency: 'CRC',
  storeName: 'Panadería La Esquina',
  code: '7KQ3MD',
  customerName: 'Ana',
  customerPhone: '+50688887777',
  customerNote: 'Sin azúcar',
  lines: [
    { name: 'Pan de ajo', quantity: 2, lineTotalMinor: 500000n },
    { name: 'Café', quantity: 1, lineTotalMinor: 150000n },
  ],
  subtotalMinor: 650000n,
  deliveryFeeMinor: 150000n,
  totalMinor: 800000n,
  fulfillment: 'DELIVERY',
  deliveryZoneName: 'Centro',
  deliveryAddress: '200 m norte de la iglesia',
  paymentLabel: 'SINPE Móvil',
  trackingUrl: 'https://booth.example/t/abc',
};

describe('buildOrderMessage', () => {
  it('includes code, items, totals, delivery, payment and tracking link in Spanish', () => {
    const message = buildOrderMessage(order);

    expect(message).toContain('*Nuevo pedido #7KQ3MD* — Panadería La Esquina');
    expect(message).toMatch(/2 × Pan de ajo — ₡\s?5\s?000/);
    expect(message).toMatch(/Envío: ₡\s?1\s?500/);
    expect(message).toMatch(/\*Total: ₡\s?8\s?000\*/);
    expect(message).toContain('Entrega a domicilio — Centro');
    expect(message).toContain('Dirección: 200 m norte de la iglesia');
    expect(message).toContain('Pago: SINPE Móvil');
    expect(message).toContain('Nota: Sin azúcar');
    expect(message).toContain('Seguimiento del pedido: https://booth.example/t/abc');
  });

  it('uses English and the store currency for a US store, without delivery lines for pickup', () => {
    const message = buildOrderMessage({
      ...order,
      locale: 'en',
      country: 'US',
      currency: 'USD',
      fulfillment: 'PICKUP',
      lines: [{ name: 'Latte', quantity: 2, lineTotalMinor: 900n }],
      subtotalMinor: 900n,
      deliveryFeeMinor: 0n,
      totalMinor: 900n,
      customerNote: null,
    });

    expect(message).toContain('2 × Latte — $9');
    expect(message).toContain('Pickup at the store');
    expect(message).not.toContain('Delivery:');
    expect(message).not.toContain('Note:');
  });
});

describe('whatsappUrl', () => {
  it('builds a wa.me link with the digits of the store phone and the encoded text', () => {
    expect(whatsappUrl('+50688887777', 'Hola #1 & más')).toBe(
      'https://wa.me/50688887777?text=Hola%20%231%20%26%20m%C3%A1s',
    );
  });
});
