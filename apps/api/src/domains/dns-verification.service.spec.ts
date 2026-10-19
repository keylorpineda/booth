import * as dns from 'node:dns/promises';

import { DnsVerificationService } from './dns-verification.service';

jest.mock('node:dns/promises');

describe('DnsVerificationService', () => {
  const service = new DnsVerificationService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies when TXT record is found at _booth.<domain>', async () => {
    (dns.resolveTxt as jest.Mock).mockResolvedValueOnce([['booth-verification=token123']]);

    const result = await service.verifyTxtRecord('example.com', 'token123');
    expect(result.verified).toBe(true);
    expect(result.errorMessage).toBeNull();
    expect(dns.resolveTxt).toHaveBeenCalledWith('_booth.example.com');
  });

  it('falls back to apex <domain> if _booth.<domain> has no records', async () => {
    (dns.resolveTxt as jest.Mock)
      .mockRejectedValueOnce({ code: 'ENOTFOUND' })
      .mockResolvedValueOnce([['other=record'], ['booth-verification=token456']]);

    const result = await service.verifyTxtRecord('example.com', 'token456');
    expect(result.verified).toBe(true);
    expect(result.errorMessage).toBeNull();
    expect(dns.resolveTxt).toHaveBeenCalledWith('_booth.example.com');
    expect(dns.resolveTxt).toHaveBeenCalledWith('example.com');
  });

  it('returns verified: false when TXT record does not contain the token', async () => {
    (dns.resolveTxt as jest.Mock).mockResolvedValue([['v=spf1 ~all']]);

    const result = await service.verifyTxtRecord('example.com', 'token789');
    expect(result.verified).toBe(false);
    expect(result.errorMessage).toContain('was not found');
  });

  it('returns verified: false when both queries fail', async () => {
    (dns.resolveTxt as jest.Mock).mockRejectedValue({ code: 'ENOTFOUND' });

    const result = await service.verifyTxtRecord('example.com', 'token789');
    expect(result.verified).toBe(false);
    expect(result.errorMessage).toContain('No TXT records found');
  });
});
