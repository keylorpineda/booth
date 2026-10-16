import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { cn } from '../../../lib/cn';
import { spring } from '../../../lib/motion';
import { NAV_ITEMS } from '../nav-items';

/** Phone navigation: fixed at the bottom, within thumb reach, clear of the home indicator. */
export function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t('dashboard.navLabel')}
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-raised/90 px-2 pt-1.5 backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end ?? false}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 rounded-control py-1 text-xs font-semibold',
                  isActive ? 'text-brand-ink' : 'text-ink-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative grid h-8 w-14 place-items-center">
                    {isActive ? (
                      <m.span
                        layoutId="bottom-nav-active"
                        transition={spring.snappy}
                        className="absolute inset-0 rounded-full bg-brand-soft"
                      />
                    ) : null}
                    <Icon className="relative size-5" />
                  </span>
                  {t(`dashboard.nav.${label}`)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
