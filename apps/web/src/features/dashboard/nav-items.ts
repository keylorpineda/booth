import { House, type LucideIcon, Package, ReceiptText, Settings } from 'lucide-react';

export interface NavItem {
  to: string;
  /** i18n key under `dashboard.nav`. */
  label: 'home' | 'orders' | 'catalog' | 'settings';
  icon: LucideIcon;
  /** Only the exact path is active (home would otherwise match every section). */
  end?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/dashboard', label: 'home', icon: House, end: true },
  { to: '/dashboard/orders', label: 'orders', icon: ReceiptText },
  { to: '/dashboard/catalog', label: 'catalog', icon: Package },
  { to: '/dashboard/settings', label: 'settings', icon: Settings },
];
