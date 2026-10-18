import * as dns from 'node:dns/promises';

import { Injectable } from '@nestjs/common';

import { VERIFICATION_TXT_RECORD_PREFIX } from '@booth/shared';

export interface DnsVerificationResult {
  verified: boolean;
  errorMessage: string | null;
}

@Injectable()
export class DnsVerificationService {
  /**
   * Verifies that the domain has a DNS TXT record matching `booth-verification=<token>`.
   * Checks `_booth.<domain>` first, and falls back to `<domain>`.
   */
  async verifyTxtRecord(domain: string, expectedToken: string): Promise<DnsVerificationResult> {
    const expectedValue = `${VERIFICATION_TXT_RECORD_PREFIX}${expectedToken}`;
    const hostsToCheck = [`_booth.${domain}`, domain];

    let lastError: string | null = null;

    for (const host of hostsToCheck) {
      try {
        const records = await dns.resolveTxt(host);
        const flatRecords = records.map((chunks) => chunks.join(''));
        if (flatRecords.some((record) => record.trim() === expectedValue)) {
          return { verified: true, errorMessage: null };
        }
      } catch (err: unknown) {
        const code = (err as { code?: string }).code;
        if (code === 'ENOTFOUND' || code === 'ENODATA' || code === 'EREFUSED') {
          lastError = `No TXT records found at ${host}`;
        } else {
          lastError = `DNS lookup failed for ${host}: ${(err as Error).message}`;
        }
      }
    }

    return {
      verified: false,
      errorMessage:
        lastError ?? `TXT record '${expectedValue}' was not found at _booth.${domain} or ${domain}`,
    };
  }
}
