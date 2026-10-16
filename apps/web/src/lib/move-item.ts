/**
 * Returns a copy with the item at `index` moved one step up (-1) or down (+1). Out-of-range moves
 * return the list unchanged. Used by the up/down reorder buttons (no drag gestures needed).
 */
export function moveItem<T>(items: readonly T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  const copy = [...items];
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return copy;
  const [item] = copy.splice(index, 1) as [T];
  copy.splice(target, 0, item);
  return copy;
}
