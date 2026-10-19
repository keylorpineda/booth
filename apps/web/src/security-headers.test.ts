import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

interface VercelHeader {
  key: string;
  value: string;
}

interface VercelConfig {
  headers: {
    source: string;
    headers: VercelHeader[];
  }[];
}

describe('web security headers (vercel.json)', () => {
  const webRoot = path.resolve(import.meta.dirname, '..');
  const indexHtml = readFileSync(path.join(webRoot, 'index.html'), 'utf8').replaceAll('\r\n', '\n');
  const vercelJson = JSON.parse(
    readFileSync(path.join(webRoot, 'vercel.json'), 'utf8'),
  ) as VercelConfig;

  const headerMap = new Map(
    (vercelJson.headers[0]?.headers ?? []).map((entry) => [entry.key, entry.value]),
  );

  it('includes a matching SHA-256 CSP hash for every inline script in index.html', () => {
    const inlineScripts = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
      (match) => match[1] ?? '',
    );
    expect(inlineScripts.length).toBeGreaterThanOrEqual(2);

    const csp = headerMap.get('Content-Security-Policy') ?? '';
    for (const script of inlineScripts) {
      const digest = createHash('sha256').update(script, 'utf8').digest('base64');
      expect(csp).toContain(`'sha256-${digest}'`);
    }
  });

  it('sets strict framing, MIME sniffing, referrer, permissions, and HSTS headers', () => {
    const csp = headerMap.get('Content-Security-Policy') ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(headerMap.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headerMap.get('X-Frame-Options')).toBe('DENY');
    expect(headerMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headerMap.get('Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=(), payment=()',
    );
    expect(headerMap.get('Strict-Transport-Security')).toContain('max-age=63072000');
  });
});
