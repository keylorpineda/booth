import { useTranslation } from 'react-i18next';

import { Logo } from '../components/brand/logo';
import { Hero } from '../features/home/components/hero';
import { HowItWorks } from '../features/home/components/how-it-works';
import { SiteHeader } from '../features/home/components/site-header';

/** Public landing: what Booth does, a live-looking order preview and links to the demos. */
export function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh">
      <title>{`Booth · ${t('home.tagline')}`}</title>
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-ink-subtle sm:flex-row">
          <Logo className="text-ink" />
          <p>{t('home.footer')}</p>
        </div>
      </footer>
    </div>
  );
}
