import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router';

import { Logo } from '../../../components/brand/logo';
import { HeaderControls } from '../../../components/layout/header-controls';
import { cn } from '../../../lib/cn';
import { spring } from '../../../lib/motion';
import { NAV_ITEMS } from '../nav-items';

/** Desktop navigation (md and up). The active pill slides between items. */
export function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface-raised px-4 py-5 md:flex">
      <Link to="/dashboard" className="px-2">
        <Logo />
      </Link>
      <nav aria-label={t('dashboard.navLabel')} className="mt-8 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end ?? false}
            className={({ isActive }) =>
              cn(
                'relative flex h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold transition-colors',
                isActive
                  ? 'text-brand-ink'
                  : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <m.span
                    layoutId="sidebar-active"
                    transition={spring.snappy}
                    className="absolute inset-0 rounded-control bg-brand-soft"
                  />
                ) : null}
                <Icon className="relative size-5" />
                <span className="relative">{t(`dashboard.nav.${label}`)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto px-2">
        <HeaderControls />
      </div>
    </aside>
  );
}
