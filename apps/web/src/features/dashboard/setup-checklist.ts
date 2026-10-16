export type SetupStepId = 'products' | 'payments' | 'hours' | 'delivery' | 'share';

export interface SetupStep {
  id: SetupStepId;
  done: boolean;
  /** Where the owner completes the step. */
  to: string;
}

export interface SetupFacts {
  hasProducts: boolean;
  cashEnabled: boolean;
  activePaymentMethods: number;
  hasHours: boolean;
  deliveryEnabled: boolean;
  activeDeliveryZones: number;
}

/**
 * What is left before the store is ready to sell, from real data. Delivery zones only matter when
 * delivery is on; hours are optional (no hours = always open) but recommended.
 */
export function setupChecklist(facts: SetupFacts): SetupStep[] {
  const steps: SetupStep[] = [
    { id: 'products', done: facts.hasProducts, to: '/dashboard/catalog' },
    {
      id: 'payments',
      done: facts.cashEnabled || facts.activePaymentMethods > 0,
      to: '/dashboard/settings?tab=payments',
    },
    { id: 'hours', done: facts.hasHours, to: '/dashboard/settings?tab=hours' },
  ];
  if (facts.deliveryEnabled) {
    steps.push({
      id: 'delivery',
      done: facts.activeDeliveryZones > 0,
      to: '/dashboard/settings?tab=delivery',
    });
  }
  return steps;
}
