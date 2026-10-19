import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button, type ButtonProps } from '../../../components/ui/button';
import { useLogoutMutation } from '../api';

/** Signs out; the route guards then send the visitor to the sign-in page. */
export function SignOutButton(props: Omit<ButtonProps, 'onClick' | 'loading'>) {
  const { t } = useTranslation();
  const logout = useLogoutMutation();

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={logout.isPending}
      onClick={() => {
        logout.mutate();
      }}
      {...props}
    >
      {logout.isPending ? null : <LogOut className="size-4" />}
      {t('auth.signOut')}
    </Button>
  );
}
