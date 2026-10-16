import { type ComponentProps, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getCountryName, getSupportedCountries } from '@booth/shared';

import { Select } from '../../../components/ui/select';

/** Every supported country, named and sorted in the interface language. */
export function CountrySelect(props: ComponentProps<'select'>) {
  const { i18n } = useTranslation();
  const countries = useMemo(() => {
    const collator = new Intl.Collator(i18n.language);
    return getSupportedCountries()
      .map((code) => ({ code, name: getCountryName(code, i18n.language) }))
      .sort((a, b) => collator.compare(a.name, b.name));
  }, [i18n.language]);

  return (
    <Select autoComplete="country" {...props}>
      {countries.map(({ code, name }) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </Select>
  );
}
