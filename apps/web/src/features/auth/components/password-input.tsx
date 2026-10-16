import { Eye, EyeOff } from 'lucide-react';
import { type ComponentProps, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '../../../components/ui/input';

/** Password input with a show/hide toggle (fewer typos on phones). */
export function PasswordInput(props: Omit<ComponentProps<'input'>, 'type'>) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className="pr-12" {...props} />
      <button
        type="button"
        onClick={() => {
          setVisible((value) => !value);
        }}
        aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-control text-ink-muted hover:text-ink"
      >
        <Icon className="size-5" />
      </button>
    </div>
  );
}
