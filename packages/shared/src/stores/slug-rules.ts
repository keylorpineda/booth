/**
 * Slug rules without Zod, so the storefront and the domain detection can use them without
 * loading the schema library (see slug.ts for the schema).
 */
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 40;

/** Words that collide with routes, subdomains or the brand. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'about',
  'admin',
  'api',
  'app',
  'assets',
  'auth',
  'billing',
  'blog',
  'booth',
  'dashboard',
  'docs',
  'help',
  'login',
  'logout',
  'mail',
  'me',
  'new',
  'privacy',
  'register',
  'root',
  's',
  'settings',
  'signup',
  'static',
  'status',
  'store',
  'stores',
  'support',
  't',
  'terms',
  'www',
]);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Suggests a slug from a store name: "Panadería La Esquina" -> "panaderia-la-esquina". */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, '');
}
