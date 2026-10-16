import { useTranslation } from 'react-i18next';

import { ApiError } from '../lib/api-client';

/** Maps an API error code to a localized, human message (never the raw English message). */
export function useErrorMessage(): (error: unknown) => string {
  const { t } = useTranslation();
  return (error) => {
    const code = error instanceof ApiError ? error.code : 'GENERIC';
    return t(`errors.${code}`, { defaultValue: t('errors.GENERIC') });
  };
}
