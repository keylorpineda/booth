import { ExternalLink, LogOut } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { useTranslation } from 'react-i18next';

import { useLogoutMutation } from '../../auth/api';
import { useSessionStore } from '../../auth/session-store';

const itemClass =
  'flex h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm outline-none data-[highlighted]:bg-surface-sunken';

/** Avatar button with the owner's account, a link to the public store and sign out. */
export function AccountMenu() {
  const { t } = useTranslation();
  const session = useSessionStore((state) => state.session);
  const logout = useLogoutMutation();
  if (!session) return null;

  const initials = session.user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={t('dashboard.account')}
        className="grid size-10 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground"
      >
        {initials}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 rounded-card border border-line bg-surface-raised p-1.5 shadow-float"
        >
          <div className="px-2.5 py-2">
            <p className="truncate font-semibold">{session.user.name}</p>
            <p className="truncate text-sm text-ink-muted">{session.user.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          {session.store ? (
            <DropdownMenu.Item asChild className={itemClass}>
              <a href={`/s/${session.store.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                {t('dashboard.viewStore')}
              </a>
            </DropdownMenu.Item>
          ) : null}
          <DropdownMenu.Item
            className={`${itemClass} text-danger`}
            onSelect={() => {
              logout.mutate();
            }}
          >
            <LogOut className="size-4" />
            {t('auth.signOut')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
