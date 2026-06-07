import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from '../../entities/membership.entity';

/**
 * Resolves the target organisation (from the `X-Org-Id` header, falling back
 * to the `org_id` query param) and verifies the authenticated user is a member.
 * Attaches `{ orgId, role }` as `request.orgContext`.
 */
@Injectable()
export class OrgGuard implements CanActivate {
  constructor(
    @InjectRepository(Membership)
    private readonly memberships: Repository<Membership>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const headerOrg = request.headers?.['x-org-id'];
    const paramOrg = request.params?.orgId;
    const queryOrg = request.query?.org_id;
    const orgId: string | undefined = headerOrg || paramOrg || queryOrg;
    if (!orgId) {
      throw new BadRequestException(
        'Organization id required (set the X-Org-Id header)',
      );
    }

    const membership = await this.memberships.findOne({
      where: { userId: user.userId, organizationId: orgId },
    });
    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    request.orgContext = { orgId, role: membership.role };
    return true;
  }
}
