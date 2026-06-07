import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLE_RANK } from '../../entities/membership.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Enforces the minimum role declared via `@Roles(...)`. Must run after
 * `OrgGuard`, which populates `request.orgContext.role`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const minRole = this.reflector.getAllAndOverride<Role | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!minRole) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const role: Role | undefined = request.orgContext?.role;
    if (!role || ROLE_RANK[role] < ROLE_RANK[minRole]) {
      throw new ForbiddenException(`Requires '${minRole}' role or higher`);
    }
    return true;
  }
}
