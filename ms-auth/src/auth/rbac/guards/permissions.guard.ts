import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { Permission } from '../enums/permission.enum.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request?.user as { permissions?: string[] } | undefined;

    if (!user) {
      throw new UnauthorizedException();
    }

    const granted = user.permissions ?? [];

    const allowed = required.every((permission) =>
      granted.includes(permission),
    );

    if (!allowed) {
      throw new ForbiddenException('No tienes permisos para esta operación');
    }

    return true;
  }
}
