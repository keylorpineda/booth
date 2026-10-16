import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Logo } from '../../../components/brand/logo';
import { HeaderControls } from '../../../components/layout/header-controls';
import { buttonVariants } from '../../../components/ui/button';

/** Sticky, translucent header of the public site. */
export function SiteHeader() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-surface/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" aria-label="Booth">
          <Logo />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <HeaderControls />
          </div>
          <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            {t('auth.signIn')}
          </Link>
        </div>
      </div>
      <div className="flex justify-end px-4 pb-2 sm:hidden">
        <HeaderControls />
      </div>
    </header>
  );
}
