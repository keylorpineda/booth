import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_BRAND_COLOR, readableForeground, toMinor } from '@booth/shared';

import { isValidHexColor } from './profile-form';
import { Field } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { brandProps } from '../../../lib/theme';
import { useOwnerMoney } from '../../dashboard/use-owner-money';

interface BrandColorFieldProps {
  value: string;
  currency: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  disabled?: boolean;
}

const SAMPLE_UNITS = 5;

/** Color picker + hex input + live preview of a product card and button in the chosen color. */
export function BrandColorField({
  value,
  currency,
  onChange,
  error,
  disabled,
}: BrandColorFieldProps) {
  const { t } = useTranslation();
  const formatMoney = useOwnerMoney();
  const validColor = isValidHexColor(value) ? value.trim().toUpperCase() : DEFAULT_BRAND_COLOR;
  const foreground = readableForeground(validColor);

  return (
    <div className="flex flex-col gap-4">
      <Field
        label={t('settings.profile.brandColor')}
        hint={t('settings.profile.brandColorHint')}
        error={error}
      >
        {(control) => (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={validColor}
              disabled={disabled}
              aria-label={t('settings.profile.colorPicker')}
              onChange={(event) => {
                onChange(event.target.value.toUpperCase());
              }}
              className="size-11 shrink-0 cursor-pointer rounded-control border border-line bg-surface p-1 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Input
              {...control}
              value={value}
              disabled={disabled}
              maxLength={7}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              placeholder={DEFAULT_BRAND_COLOR}
              onChange={(event) => {
                onChange(event.target.value);
              }}
              className="max-w-36 font-mono uppercase"
            />
          </div>
        )}
      </Field>

      <div
        {...brandProps(validColor, foreground)}
        className="rounded-card border border-line bg-surface p-4"
      >
        <p className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
          {t('settings.profile.previewTitle')}
        </p>
        <div className="mt-3 flex items-center gap-3 rounded-card bg-surface-raised p-3 shadow-card">
          <div className="grid size-16 shrink-0 place-items-center rounded-control bg-brand-soft text-lg font-extrabold text-brand-ink">
            B
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{t('settings.profile.previewProduct')}</p>
            <p className="mt-1 font-bold">
              {formatMoney(toMinor(SAMPLE_UNITS, currency), currency)}
            </p>
          </div>
          <span className="rounded-pill inline-flex h-9 items-center gap-1.5 bg-brand px-3.5 text-sm font-semibold text-brand-foreground shadow-card">
            <Plus className="size-4" strokeWidth={2.5} />
            {t('storefront.add')}
          </span>
        </div>
      </div>
    </div>
  );
}
