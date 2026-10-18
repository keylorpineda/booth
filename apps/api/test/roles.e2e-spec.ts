import { type INestApplication } from '@nestjs/common';
import request, { type Test } from 'supertest';
import { type App } from 'supertest/types';

import { type AuthResponse, authResponseSchema, storeInvitationSchema } from '@booth/shared';

import { bearer } from './utils/auth';
import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { createOwnerWithStore, type TestStoreOwner } from './utils/stores';
import { PrismaService } from '../src/prisma/prisma.service';

describe('role-based access control (RBAC) and team memberships', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let owner: TestStoreOwner;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    owner = await createOwnerWithStore(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const as = (token: string, build: (http: ReturnType<typeof request>) => Test) =>
    build(request(app.getHttpServer())).set('Authorization', bearer(token));

  async function inviteAndAccept(
    email: string,
    role: 'STAFF' | 'CATALOG_MANAGER',
  ): Promise<AuthResponse> {
    // 1. Owner invites member
    const inviteRes = await as(owner.accessToken, (h) =>
      h.post('/api/me/team/invitations').send({ email, role }),
    ).expect(201);
    const invite = storeInvitationSchema.parse(inviteRes.body);

    // 2. Member accepts invitation
    const acceptRes = await request(app.getHttpServer())
      .post(`/api/public/invitations/${invite.token}/accept`)
      .send({ name: `User ${role}`, password: 'password-12345' })
      .expect(200);

    return authResponseSchema.parse(acceptRes.body);
  }

  it('allows owner full access to team, orders, catalog and settings', async () => {
    // Team list
    await as(owner.accessToken, (h) => h.get('/api/me/team/members')).expect(200);

    // Orders list
    await as(owner.accessToken, (h) => h.get('/api/me/orders')).expect(200);

    // Products list
    await as(owner.accessToken, (h) => h.get('/api/me/products')).expect(200);

    // Settings (store patch)
    await as(owner.accessToken, (h) =>
      h.patch('/api/me/store').send({ name: 'Updated Store Name' }),
    ).expect(200);
  });

  it('STAFF: can view and manage orders, but is forbidden from catalog, settings and team management', async () => {
    const staff = await inviteAndAccept('staff@example.com', 'STAFF');

    // 1. Can view orders
    await as(staff.accessToken, (h) => h.get('/api/me/orders')).expect(200);

    // 2. Forbidden from modifying store settings
    await as(staff.accessToken, (h) =>
      h.patch('/api/me/store').send({ name: 'Hacked Name' }),
    ).expect(403);

    // 3. Forbidden from catalog changes (create product)
    await as(staff.accessToken, (h) =>
      h.post('/api/me/products').send({
        name: 'Forbidden Product',
        slug: 'forbidden-product',
        price: 1000,
      }),
    ).expect(403);

    // 4. Forbidden from team management
    await as(staff.accessToken, (h) => h.get('/api/me/team/members')).expect(403);
    await as(staff.accessToken, (h) =>
      h.post('/api/me/team/invitations').send({ email: 'other@example.com', role: 'STAFF' }),
    ).expect(403);
  });

  it('CATALOG_MANAGER: can manage products and categories, but is forbidden from orders, settings and team management', async () => {
    const manager = await inviteAndAccept('catalog@example.com', 'CATALOG_MANAGER');

    // 1. Can view and create products
    await as(manager.accessToken, (h) => h.get('/api/me/products')).expect(200);
    await as(manager.accessToken, (h) =>
      h.post('/api/me/products').send({
        name: 'Manager Product',
        slug: 'manager-product',
        price: 2500,
      }),
    ).expect(201);

    // 2. Forbidden from viewing orders
    await as(manager.accessToken, (h) => h.get('/api/me/orders')).expect(403);

    // 3. Forbidden from modifying store settings
    await as(manager.accessToken, (h) =>
      h.patch('/api/me/store').send({ name: 'Manager New Name' }),
    ).expect(403);

    // 4. Forbidden from team management
    await as(manager.accessToken, (h) => h.get('/api/me/team/members')).expect(403);
  });

  it('revoking a member immediately cuts off their access', async () => {
    const staff = await inviteAndAccept('revokeme@example.com', 'STAFF');

    // Currently can access orders
    await as(staff.accessToken, (h) => h.get('/api/me/orders')).expect(200);

    // Owner finds staff membership
    const membersRes = await as(owner.accessToken, (h) => h.get('/api/me/team/members')).expect(
      200,
    );
    const staffMember = (membersRes.body as { id: string; user: { email: string } }[]).find(
      (m) => m.user.email === 'revokeme@example.com',
    );
    expect(staffMember).toBeDefined();

    // Owner removes staff member
    await as(owner.accessToken, (h) => h.delete(`/api/me/team/members/${staffMember?.id}`)).expect(
      204,
    );

    // Staff access is now forbidden
    await as(staff.accessToken, (h) => h.get('/api/me/orders')).expect(403);
  });

  it('prevents owner from removing themselves', async () => {
    const membersRes = await as(owner.accessToken, (h) => h.get('/api/me/team/members')).expect(
      200,
    );
    const ownerMember = (membersRes.body as { id: string; role: string }[]).find(
      (m) => m.role === 'OWNER',
    );
    expect(ownerMember).toBeDefined();

    await as(owner.accessToken, (h) => h.delete(`/api/me/team/members/${ownerMember?.id}`)).expect(
      400,
    );
  });
});
