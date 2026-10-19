import { type PublicStore } from '@booth/shared';

export type PublicTransferMethod = PublicStore['payment']['transfer'][number];

/**
 * One checkout option per way of paying. A store may list two SINPE Móvil numbers (for example a
 * personal and a business one): the customer only needs to choose "SINPE Móvil", so methods with
 * the same preset or the same name collapse into the first one, in the owner's order.
 */
export function paymentChoices(methods: readonly PublicTransferMethod[]): PublicTransferMethod[] {
  const seen = new Set<string>();
  return methods.filter((method) => {
    const key = method.preset ?? method.label.trim().toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
