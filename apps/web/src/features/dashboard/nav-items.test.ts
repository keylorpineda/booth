import { describe, expect, it } from 'vitest';

import { canOpenPath } from './nav-items';

describe('canOpenPath', () => {
  it('lets owners open every section', () => {
    expect(canOpenPath('/dashboard/settings', 'OWNER')).toBe(true);
    expect(canOpenPath('/dashboard/catalog/products/new', 'OWNER')).toBe(true);
  });

  it('keeps staff out of the catalog and settings, but not orders', () => {
    expect(canOpenPath('/dashboard/orders/o1', 'STAFF')).toBe(true);
    expect(canOpenPath('/dashboard/catalog/products/p1', 'STAFF')).toBe(false);
    expect(canOpenPath('/dashboard/settings', 'STAFF')).toBe(false);
  });

  it('keeps catalog managers out of orders', () => {
    expect(canOpenPath('/dashboard/catalog', 'CATALOG_MANAGER')).toBe(true);
    expect(canOpenPath('/dashboard/orders', 'CATALOG_MANAGER')).toBe(false);
  });

  it('always allows the dashboard home', () => {
    expect(canOpenPath('/dashboard', 'STAFF')).toBe(true);
  });
});
