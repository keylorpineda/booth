import { z } from 'zod';

export const CUSTOM_DOMAIN_STATUSES = ['PENDING', 'ACTIVE', 'FAILED'] as const;
export type CustomDomainStatus = (typeof CUSTOM_DOMAIN_STATUSES)[number];

export const customDomainStatusSchema = z.enum(CUSTOM_DOMAIN_STATUSES);

export const VERIFICATION_TXT_RECORD_PREFIX = 'booth-verification=';

const DOMAIN_REGEX = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/;

export const customDomainNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(253)
  .regex(DOMAIN_REGEX, 'Enter a valid domain name (e.g. shop.example.com or mybrand.com)')
  .refine(
    (val) => !val.endsWith('.localhost') && val !== 'localhost',
    'Localhost domains cannot be used as custom domains',
  )
  .refine(
    (val) => !val.endsWith('.booth.app') && val !== 'booth.app',
    'Booth domains are managed automatically as subdomains',
  );

export const createCustomDomainInputSchema = z.object({
  domain: customDomainNameSchema,
});

export type CreateCustomDomainInput = z.infer<typeof createCustomDomainInputSchema>;

export const customDomainSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  domain: z.string(),
  status: customDomainStatusSchema,
  verificationToken: z.string(),
  verifiedAt: z.string().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CustomDomain = z.infer<typeof customDomainSchema>;
