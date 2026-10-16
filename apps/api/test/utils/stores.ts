import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import { type Store, storeSchema } from '@booth/shared';

import { bearer, registerOwner, type TestOwner } from './auth';

let counter = 0;

export interface TestStoreOwner extends TestOwner {
  store: Store;
  /** `Authorization` header value. */
  auth: string;
}

/** Registers an owner and completes onboarding with a unique slug. */
export async function createOwnerWithStore(app: INestApplication<App>): Promise<TestStoreOwner> {
  counter += 1;
  const owner = await registerOwner(app);
  const response = await request(app.getHttpServer())
    .post('/api/me/store')
    .set('Authorization', bearer(owner.accessToken))
    .send({ name: `Store ${counter}`, slug: `store-${counter}`, whatsappPhone: '+50688887777' })
    .expect(201);

  return { ...owner, store: storeSchema.parse(response.body), auth: bearer(owner.accessToken) };
}
