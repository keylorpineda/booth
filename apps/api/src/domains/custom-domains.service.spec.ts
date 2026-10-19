import { CustomDomainsService } from './custom-domains.service';
import { type DnsVerificationService } from './dns-verification.service';
import { type PrismaService } from '../prisma/prisma.service';

describe('CustomDomainsService', () => {
  let service: CustomDomainsService;
  let prisma: {
    customDomain: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let dns: jest.Mocked<DnsVerificationService>;

  beforeEach(() => {
    prisma = {
      customDomain: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    dns = {
      verifyTxtRecord: jest.fn(),
    };

    service = new CustomDomainsService(prisma as unknown as PrismaService, dns);
  });

  it('gets custom domain for a store', async () => {
    const mockDomain = {
      id: 'cd1',
      storeId: 's1',
      domain: 'shop.example.com',
      status: 'ACTIVE' as const,
      verificationToken: 'token123',
      verifiedAt: new Date('2026-10-18T00:00:00Z'),
      errorMessage: null,
      createdAt: new Date('2026-10-18T00:00:00Z'),
      updatedAt: new Date('2026-10-18T00:00:00Z'),
    };
    prisma.customDomain.findUnique.mockResolvedValue(mockDomain);

    const result = await service.get('s1');
    expect(result).toEqual({
      id: 'cd1',
      storeId: 's1',
      domain: 'shop.example.com',
      status: 'ACTIVE',
      verificationToken: 'token123',
      verifiedAt: '2026-10-18T00:00:00.000Z',
      errorMessage: null,
      createdAt: '2026-10-18T00:00:00.000Z',
      updatedAt: '2026-10-18T00:00:00.000Z',
    });
  });

  it('creates a custom domain with PENDING status and generated token', async () => {
    prisma.customDomain.findUnique.mockResolvedValue(null);
    prisma.customDomain.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({
        id: 'cd1',
        ...data,
        verifiedAt: null,
        errorMessage: null,
        createdAt: new Date('2026-10-18T00:00:00Z'),
        updatedAt: new Date('2026-10-18T00:00:00Z'),
      }),
    );

    const result = await service.create('s1', { domain: 'shop.example.com' });
    expect(result.domain).toBe('shop.example.com');
    expect(result.status).toBe('PENDING');
    expect(result.verificationToken).toHaveLength(32);
    expect(prisma.customDomain.create).toHaveBeenCalled();
  });

  it('rejects creation if store already has a custom domain', async () => {
    prisma.customDomain.findUnique.mockResolvedValueOnce({ id: 'cd-existing' });

    await expect(service.create('s1', { domain: 'shop.example.com' })).rejects.toThrow(
      'Your store already has a custom domain',
    );
  });

  it('rejects creation if domain is already claimed by another store', async () => {
    prisma.customDomain.findUnique
      .mockResolvedValueOnce(null) // store check
      .mockResolvedValueOnce({ id: 'cd-other-store' }); // domain check

    await expect(service.create('s1', { domain: 'taken.com' })).rejects.toThrow(
      'This domain is already registered',
    );
  });

  it('activates domain when DNS verification passes', async () => {
    const existing = {
      id: 'cd1',
      storeId: 's1',
      domain: 'shop.example.com',
      status: 'PENDING' as const,
      verificationToken: 'token123',
      verifiedAt: null,
      errorMessage: null,
      createdAt: new Date('2026-10-18T00:00:00Z'),
      updatedAt: new Date('2026-10-18T00:00:00Z'),
    };
    prisma.customDomain.findUnique.mockResolvedValue(existing);
    dns.verifyTxtRecord.mockResolvedValue({ verified: true, errorMessage: null });
    prisma.customDomain.update.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({
        ...existing,
        ...data,
        verifiedAt: new Date('2026-10-18T00:00:00Z'),
      }),
    );

    const result = await service.verify('s1');
    expect(result.status).toBe('ACTIVE');
    expect(prisma.customDomain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cd1' },
        data: expect.objectContaining({ status: 'ACTIVE' }),
      }),
    );
  });

  it('marks domain as FAILED when DNS verification fails', async () => {
    const existing = {
      id: 'cd1',
      storeId: 's1',
      domain: 'shop.example.com',
      status: 'PENDING' as const,
      verificationToken: 'token123',
      verifiedAt: null,
      errorMessage: null,
      createdAt: new Date('2026-10-18T00:00:00Z'),
      updatedAt: new Date('2026-10-18T00:00:00Z'),
    };
    prisma.customDomain.findUnique.mockResolvedValue(existing);
    dns.verifyTxtRecord.mockResolvedValue({
      verified: false,
      errorMessage: 'Record not found',
    });
    prisma.customDomain.update.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({
        ...existing,
        ...data,
      }),
    );

    const result = await service.verify('s1');
    expect(result.status).toBe('FAILED');
    expect(result.errorMessage).toBe('Record not found');
  });

  it('removes custom domain', async () => {
    prisma.customDomain.findUnique.mockResolvedValue({ id: 'cd1' });
    await service.remove('s1');
    expect(prisma.customDomain.delete).toHaveBeenCalledWith({ where: { id: 'cd1' } });
  });
});
