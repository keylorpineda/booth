import {
  useBusinessHours,
  useDeliveryZones,
  useHasProducts,
  useOwnerStore,
  usePaymentMethods,
} from './api';
import { setupChecklist, type SetupStep } from './setup-checklist';

/** The setup checklist from the owner endpoints; null while any of them is loading. */
export function useSetupChecklist(): { steps: SetupStep[] | null; error: unknown } {
  const store = useOwnerStore();
  const products = useHasProducts();
  const methods = usePaymentMethods();
  const hours = useBusinessHours();
  const zones = useDeliveryZones();
  const error = store.error ?? products.error ?? methods.error ?? hours.error ?? zones.error;

  if (!store.data || products.data === undefined || !methods.data || !hours.data || !zones.data) {
    return { steps: null, error };
  }
  return {
    steps: setupChecklist({
      hasProducts: products.data,
      cashEnabled: store.data.cashEnabled,
      activePaymentMethods: methods.data.filter((method) => method.isActive).length,
      hasHours: hours.data.length > 0,
      deliveryEnabled: store.data.deliveryEnabled,
      activeDeliveryZones: zones.data.filter((zone) => zone.isActive).length,
    }),
    error,
  };
}
