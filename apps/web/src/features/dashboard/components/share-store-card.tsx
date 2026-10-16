import { Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '../../../components/ui/button';
import { CopyButton } from '../../../components/ui/copy-button';
import { cn } from '../../../lib/cn';

/** The public link, ready to copy or share on WhatsApp. */
export function ShareStoreCard({ slug, name }: { slug: string; name: string }) {
  const { t } = useTranslation();
  const url = `${window.location.origin}/s/${slug}`;
  const message = encodeURIComponent(t('dashboard.share.message', { name, url }));

  return (
    <section className="relative overflow-hidden rounded-card bg-brand p-5 text-brand-foreground shadow-glow sm:p-6">
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-16 size-48 rounded-full bg-brand-foreground/10"
      />
      <h2 className="relative text-lg font-bold">{t('dashboard.share.title')}</h2>
      <p className="relative mt-1 text-sm opacity-85">{t('dashboard.share.text')}</p>
      <div className="relative mt-4 flex items-center gap-1 rounded-control bg-surface-raised py-1 pr-1 pl-3 text-ink">
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{url}</span>
        <CopyButton value={url} label={t('dashboard.share.link')} />
      </div>
      <a
        href={`https://wa.me/?text=${message}`}
        target="_blank"
        rel="noreferrer"
        className={cn(
          buttonVariants({ variant: 'secondary', block: true }),
          'relative mt-3 bg-brand-foreground text-brand hover:bg-brand-foreground/90',
        )}
      >
        <Share2 className="size-4" />
        {t('dashboard.share.whatsapp')}
      </a>
    </section>
  );
}
