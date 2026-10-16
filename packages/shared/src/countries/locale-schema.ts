import { z } from 'zod';

import { APP_LOCALES } from './locales';

export const appLocaleSchema = z.enum(APP_LOCALES);
