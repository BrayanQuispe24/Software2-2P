import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PermissionsGuard } from '../../../src/auth/rbac/guards/permissions.guard.js';
import { Permission } from '../../../src/auth/rbac/enums/permission.enum.js';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createMockContext = (user?: { permissions?: string[] }): ExecutionContext => {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('permite el acceso si la ruta no exige ningún permiso', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('permite el acceso si la lista de permisos requeridos está vacía', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const context = createMockContext();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('lanza UnauthorizedException si el usuario no está presente en la solicitud', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.USERS_READ]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('lanza ForbiddenException si el usuario no tiene los permisos requeridos', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      Permission.USERS_READ,
      Permission.USERS_CREATE,
    ]);
    const context = createMockContext({
      permissions: [Permission.USERS_READ],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('permite el acceso si el usuario cuenta con todos los permisos requeridos', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      Permission.USERS_READ,
      Permission.USERS_UPDATE,
    ]);
    const context = createMockContext({
      permissions: [
        Permission.USERS_READ,
        Permission.USERS_UPDATE,
        Permission.PROFILE_READ,
      ],
    });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });
});
