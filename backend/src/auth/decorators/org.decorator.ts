import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../../entities/membership.entity';

/** Injects the verified organisation id for the current request. */
export const OrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.orgContext?.orgId;
  },
);

/** Injects the caller's role within the current organisation. */
export const OrgRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Role => {
    const request = ctx.switchToHttp().getRequest();
    return request.orgContext?.role;
  },
);
