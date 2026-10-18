import { type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';
import { AppException } from '../../common/errors/app.exception';
import { IS_PUBLIC } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (
    authContext: { storeId?: string | null; role?: string | null } | undefined,
  ): ExecutionContext => {
    const request = {
      auth: authContext,
    };

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('allows access if route is public', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC) return true;
      return ['OWNER'];
    });

    const context = createMockContext(undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC) return false;
      if (key === ROLES_KEY) return undefined;
      return undefined;
    });

    const context = createMockContext({ storeId: 's1', role: 'STAFF' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access if user has one of the required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC) return false;
      if (key === ROLES_KEY) return ['OWNER', 'STAFF'];
      return undefined;
    });

    const context = createMockContext({ storeId: 's1', role: 'STAFF' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws AppException ONBOARDING_REQUIRED if user has no storeId', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC) return false;
      if (key === ROLES_KEY) return ['OWNER'];
      return undefined;
    });

    const context = createMockContext({ storeId: null, role: null });
    expect(() => guard.canActivate(context)).toThrow(AppException);
    try {
      guard.canActivate(context);
    } catch (err) {
      expect(err).toBeInstanceOf(AppException);
      expect((err as AppException).code).toBe('ONBOARDING_REQUIRED');
    }
  });

  it('throws AppException FORBIDDEN if user role is not in required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC) return false;
      if (key === ROLES_KEY) return ['OWNER'];
      return undefined;
    });

    const context = createMockContext({ storeId: 's1', role: 'STAFF' });
    expect(() => guard.canActivate(context)).toThrow(AppException);
    try {
      guard.canActivate(context);
    } catch (err) {
      expect(err).toBeInstanceOf(AppException);
      expect((err as AppException).code).toBe('FORBIDDEN');
    }
  });
});
