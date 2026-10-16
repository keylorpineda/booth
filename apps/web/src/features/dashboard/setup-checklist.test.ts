import { describe, expect, it } from 'vitest';

import { type SetupFacts, setupChecklist } from './setup-checklist';

const empty: SetupFacts = {
  hasProducts: false,
  cashEnabled: false,
  activePaymentMethods: 0,
  hasHours: false,
  deliveryEnabled: false,
  activeDeliveryZones: 0,
};

const status = (facts: SetupFacts) =>
  Object.fromEntries(setupChecklist(facts).map((step) => [step.id, step.done]));

describe('setupChecklist', () => {
  it('shows "add products" as pending, with a link, for a store without products', () => {
    const products = setupChecklist(empty).find((step) => step.id === 'products');
    expect(products).toEqual({ id: 'products', done: false, to: '/dashboard/catalog' });
  });

  it('counts cash or an active transfer method as a way to get paid', () => {
    expect(status({ ...empty, cashEnabled: true }).payments).toBe(true);
    expect(status({ ...empty, activePaymentMethods: 1 }).payments).toBe(true);
    expect(status(empty).payments).toBe(false);
  });

  it('asks for delivery zones only when delivery is on', () => {
    expect(status(empty)).not.toHaveProperty('delivery');
    expect(status({ ...empty, deliveryEnabled: true }).delivery).toBe(false);
    expect(status({ ...empty, deliveryEnabled: true, activeDeliveryZones: 2 }).delivery).toBe(true);
  });

  it('is complete for a store that is ready to sell', () => {
    const ready = { ...empty, hasProducts: true, cashEnabled: true, hasHours: true };
    expect(setupChecklist(ready).every((step) => step.done)).toBe(true);
  });
});
