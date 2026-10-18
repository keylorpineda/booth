import { describe, expect, it } from 'vitest';

import {
  createCustomDomainInputSchema,
  customDomainNameSchema,
  customDomainStatusSchema,
} from './custom-domain';

describe('customDomainNameSchema', () => {
  it('accepts valid apex domains and subdomains', () => {
    expect(customDomainNameSchema.parse('tienda.com')).toBe('tienda.com');
    expect(customDomainNameSchema.parse('TIENDA.COM')).toBe('tienda.com');
    expect(customDomainNameSchema.parse('shop.tienda.cr')).toBe('shop.tienda.cr');
    expect(customDomainNameSchema.parse('mi-tienda-online.org')).toBe('mi-tienda-online.org');
  });

  it('rejects invalid domains', () => {
    expect(() => customDomainNameSchema.parse('')).toThrow();
    expect(() => customDomainNameSchema.parse('invalid')).toThrow();
    expect(() => customDomainNameSchema.parse('-invalid.com')).toThrow();
    expect(() => customDomainNameSchema.parse('invalid-.com')).toThrow();
    expect(() => customDomainNameSchema.parse('tienda..com')).toThrow();
    expect(() => customDomainNameSchema.parse('tienda.com/path')).toThrow();
    expect(() => customDomainNameSchema.parse('https://tienda.com')).toThrow();
  });

  it('rejects booth.app and localhost domains', () => {
    expect(() => customDomainNameSchema.parse('booth.app')).toThrow();
    expect(() => customDomainNameSchema.parse('sub.booth.app')).toThrow();
    expect(() => customDomainNameSchema.parse('localhost')).toThrow();
    expect(() => customDomainNameSchema.parse('sub.localhost')).toThrow();
  });

  it('validates createCustomDomainInputSchema', () => {
    const parsed = createCustomDomainInputSchema.parse({ domain: 'STORE.EXAMPLE.COM' });
    expect(parsed.domain).toBe('store.example.com');
  });

  it('validates customDomainStatusSchema', () => {
    expect(customDomainStatusSchema.parse('PENDING')).toBe('PENDING');
    expect(customDomainStatusSchema.parse('ACTIVE')).toBe('ACTIVE');
    expect(customDomainStatusSchema.parse('FAILED')).toBe('FAILED');
    expect(() => customDomainStatusSchema.parse('UNKNOWN')).toThrow();
  });
});
