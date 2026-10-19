import { House, type LucideIcon, Package, ReceiptText, Settings } from 'lucide-react';

import { type StoreRole } from '@booth/shared';

export interface NavItem {
  to: string;
  /** i18n key under `dashboard.nav`. */
  label: 'home' | 'orders' | 'catalog' | 'settings';
  icon: LucideIcon;
  /** Only the exact path is active (home would otherwise match every section). */
  end?: boolean;
  roles?: readonly StoreRole[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/dashboard', label: 'home', icon: House, end: true },
  { to: '/dashboard/orders', label: 'orders', icon: ReceiptText, roles: ['OWNER', 'STAFF'] },
  {
    to: '/dashboard/catalog',
    label: 'catalog',
    icon: Package,
    roles: ['OWNER', 'CATALOG_MANAGER'],
  },
  { to: '/dashboard/settings', label: 'settings', icon: Settings, roles: ['OWNER'] },
];

export function getNavItemsForRole(role?: StoreRole | null): readonly NavItem[] {
  const currentRole = role ?? 'OWNER';
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(currentRole));
}
