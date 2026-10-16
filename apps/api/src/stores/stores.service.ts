import { HttpStatus, Injectable } from '@nestjs/common';

import {
  type CreateStoreInput,
  getCountryProfile,
  RESERVED_SLUGS,
  resolveAppLocale,
  type SlugAvailability,
  slugSchema,
  STORE_DEFAULTS,
  type Store,
} from '@booth/shared';

import { toStoreDto } from './store.mapper';
import { AppException } from '../common/errors/app.exception';
import { isUniqueViolation } from '../prisma/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  /** Onboarding: one store per owner. Localization defaults come from the country profile. */
  async create(ownerId: string, input: CreateStoreInput): Promise<Store> {
    const country = input.country ?? STORE_DEFAULTS.country;
    const profile = getCountryProfile(country);

    try {
      const store = await this.prisma.store.create({
        data: {
          ownerId,
          name: input.name,
          slug: input.slug,
          whatsappPhone: input.whatsappPhone,
          country,
          currency: input.currency ?? profile.currency,
          timezone: input.timezone ?? profile.timezone,
          locale: input.locale ?? resolveAppLocale(profile.locale),
        },
      });
      return toStoreDto(store);
    } catch (error) {
      if (isUniqueViolation(error, 'ownerId')) throw storeAlreadyExists();
      if (isUniqueViolation(error, 'slug')) {
        throw new AppException('SLUG_TAKEN', 'This store URL is taken', HttpStatus.CONFLICT, {
          field: 'slug',
        });
      }
      throw error;
    }
  }

  async get(storeId: string): Promise<Store> {
    return toStoreDto(await this.prisma.store.findUniqueOrThrow({ where: { id: storeId } }));
  }

  async slugAvailability(slug: string): Promise<SlugAvailability> {
    const normalized = slug.trim().toLowerCase();
    if (RESERVED_SLUGS.has(normalized)) {
      return { slug: normalized, available: false, reason: 'reserved' };
    }
    if (!slugSchema.safeParse(normalized).success) {
      return { slug: normalized, available: false, reason: 'invalid' };
    }
    const taken = await this.prisma.store.findUnique({
      where: { slug: normalized },
      select: { id: true },
    });
    return taken
      ? { slug: normalized, available: false, reason: 'taken' }
      : { slug: normalized, available: true };
  }
}

function storeAlreadyExists(): AppException {
  return new AppException(
    'STORE_ALREADY_EXISTS',
    'This account already has a store',
    HttpStatus.CONFLICT,
  );
}
