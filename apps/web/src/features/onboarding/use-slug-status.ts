import { useSlugAvailability } from './api';
import { slugField } from './onboarding-form';
import { useDebouncedValue } from '../../hooks/use-debounced-value';

export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'unavailable';

/** Availability of the slug being typed: checked on the server once typing pauses. */
export function useSlugStatus(slug: string): SlugStatus {
  const debounced = useDebouncedValue(slug.trim());
  const valid = slugField.safeParse(debounced).success;
  const query = useSlugAvailability(debounced, valid);

  if (!valid) return 'idle';
  if (debounced !== slug.trim() || query.isFetching) return 'checking';
  if (!query.data) return 'idle';
  if (query.data.available) return 'available';
  return query.data.reason === 'taken' ? 'taken' : 'unavailable';
}
