import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../roles.guard';
import { Role } from '@smart-attendance/shared';

function createMockContext(user: { role: Role } | null): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext({ role: Role.EMPLOYEE });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow ADMIN when ADMIN role is required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = createMockContext({ role: Role.ADMIN });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow MANAGER when ADMIN or MANAGER is required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.MANAGER]);
    const ctx = createMockContext({ role: Role.MANAGER });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny EMPLOYEE when only ADMIN is required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = createMockContext({ role: Role.EMPLOYEE });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should deny when no user present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = createMockContext(null);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
