import { useTranslation } from 'react-i18next';

import { Logo } from '../components/brand/logo';
import { Hero } from '../features/home/components/hero';
import { SiteHeader } from '../features/home/components/site-header';

/** Public landing: what Booth does, shown as an animated ordering flow, and a link to the demo. */
export function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col">
      <title>{`Booth · ${t('home.tagline')}`}</title>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-6 text-sm text-ink-subtle">
          <Logo className="text-ink" />
          <p>© Booth</p>
        </div>
      </footer>
    </div>
  );
}
