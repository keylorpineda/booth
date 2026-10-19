import { randomBytes } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';

import { type CreateCustomDomainInput, type CustomDomain } from '@booth/shared';

import { DnsVerificationService } from './dns-verification.service';
import { AppException } from '../common/errors/app.exception';
import { PrismaService } from '../prisma/prisma.service';

interface CustomDomainRecord {
  id: string;
  storeId: string;
  domain: string;
  status: 'PENDING' | 'ACTIVE' | 'FAILED';
  verificationToken: string;
  verifiedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toCustomDomainResponse(record: CustomDomainRecord): CustomDomain {
  return {
    id: record.id,
    storeId: record.storeId,
    domain: record.domain,
    status: record.status,
    verificationToken: record.verificationToken,
    verifiedAt: record.verifiedAt ? record.verifiedAt.toISOString() : null,
    errorMessage: record.errorMessage,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

@Injectable()
export class CustomDomainsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dnsVerification: DnsVerificationService,
  ) {}

  async get(storeId: string): Promise<CustomDomain | null> {
    const domain = await this.prisma.customDomain.findUnique({
      where: { storeId },
    });
    return domain ? toCustomDomainResponse(domain) : null;
  }

  async create(storeId: string, input: CreateCustomDomainInput): Promise<CustomDomain> {
    const existingForStore = await this.prisma.customDomain.findUnique({
      where: { storeId },
    });
    if (existingForStore) {
      throw new AppException(
        'CONFLICT',
        'Your store already has a custom domain configured. Remove it first to connect a new one.',
        HttpStatus.CONFLICT,
      );
    }

    // Other stores are invisible inside the store scope: check the whole table on purpose.
    const domainTaken = await this.prisma.unscoped.customDomain.findUnique({
      where: { domain: input.domain },
    });
    if (domainTaken) {
      throw new AppException(
        'CONFLICT',
        'This domain is already registered to another store.',
        HttpStatus.CONFLICT,
      );
    }

    const verificationToken = randomBytes(16).toString('hex');

    const created = await this.prisma.customDomain.create({
      data: {
        storeId,
        domain: input.domain,
        status: 'PENDING',
        verificationToken,
      },
    });

    return toCustomDomainResponse(created);
  }

  async verify(storeId: string): Promise<CustomDomain> {
    const existing = await this.prisma.customDomain.findUnique({
      where: { storeId },
    });
    if (!existing) {
      throw new AppException(
        'NOT_FOUND',
        'No custom domain found for this store',
        HttpStatus.NOT_FOUND,
      );
    }

    const result = await this.dnsVerification.verifyTxtRecord(
      existing.domain,
      existing.verificationToken,
    );

    const updated = await this.prisma.customDomain.update({
      where: { id: existing.id },
      data: result.verified
        ? {
            status: 'ACTIVE',
            verifiedAt: new Date(),
            errorMessage: null,
          }
        : {
            status: 'FAILED',
            errorMessage: result.errorMessage,
          },
    });

    return toCustomDomainResponse(updated);
  }

  async remove(storeId: string): Promise<void> {
    const existing = await this.prisma.customDomain.findUnique({
      where: { storeId },
    });
    if (!existing) {
      return;
    }

    await this.prisma.customDomain.delete({
      where: { id: existing.id },
    });
  }
}
