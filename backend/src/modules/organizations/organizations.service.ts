import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Organization } from '../../entities/organization.entity';
import { Membership, Role, ROLE_RANK } from '../../entities/membership.entity';
import { UsersService } from '../../auth/users.service';
import { AddMemberDto } from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgs: Repository<Organization>,
    @InjectRepository(Membership)
    private readonly memberships: Repository<Membership>,
    private readonly users: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  /** Create an organisation and make the caller its owner. */
  async create(userId: string, name: string) {
    const org = await this.dataSource.transaction(async (em) => {
      const created = await em.save(em.create(Organization, { name }));
      await em.save(
        em.create(Membership, {
          userId,
          organizationId: created.id,
          role: Role.owner,
        }),
      );
      return created;
    });
    return { ...org.toDict(), role: Role.owner };
  }

  /** Organisations the caller belongs to, with their role in each. */
  async listForUser(userId: string) {
    const memberships = await this.memberships.find({
      where: { userId },
      relations: { organization: true },
      order: { createdAt: 'ASC' },
    });
    return memberships.map((m) => ({
      ...(m.organization?.toDict() ?? { id: m.organizationId }),
      role: m.role,
    }));
  }

  async listMembers(orgId: string) {
    const members = await this.memberships.find({
      where: { organizationId: orgId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
    return members.map((m) => ({
      user_id: m.userId,
      email: m.user?.email ?? null,
      name: m.user?.name ?? null,
      role: m.role,
      created_at: m.createdAt ? m.createdAt.toISOString() : null,
    }));
  }

  async addMember(orgId: string, dto: AddMemberDto, requesterRole: Role) {
    this.assertCanAssign(requesterRole, dto.role);

    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException(
        'No user with that email has signed in yet; ask them to sign in first',
      );
    }

    const existing = await this.memberships.findOne({
      where: { userId: user.id, organizationId: orgId },
    });
    if (existing) {
      throw new ConflictException('User is already a member');
    }

    const membership = await this.memberships.save(
      this.memberships.create({
        userId: user.id,
        organizationId: orgId,
        role: dto.role,
      }),
    );
    return {
      user_id: membership.userId,
      email: user.email,
      role: membership.role,
    };
  }

  async updateMemberRole(
    orgId: string,
    targetUserId: string,
    role: Role,
    requesterRole: Role,
  ) {
    this.assertCanAssign(requesterRole, role);

    const membership = await this.memberships.findOne({
      where: { userId: targetUserId, organizationId: orgId },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.role === Role.owner && role !== Role.owner) {
      await this.assertNotLastOwner(orgId);
    }

    membership.role = role;
    await this.memberships.save(membership);
    return { user_id: targetUserId, role };
  }

  async removeMember(orgId: string, targetUserId: string) {
    const membership = await this.memberships.findOne({
      where: { userId: targetUserId, organizationId: orgId },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    if (membership.role === Role.owner) {
      await this.assertNotLastOwner(orgId);
    }
    await this.memberships.remove(membership);
  }

  /** A member may not grant a role higher than their own. */
  private assertCanAssign(requesterRole: Role, targetRole: Role) {
    if (ROLE_RANK[targetRole] > ROLE_RANK[requesterRole]) {
      throw new ForbiddenException(
        `Cannot assign a role higher than your own ('${requesterRole}')`,
      );
    }
  }

  private async assertNotLastOwner(orgId: string) {
    const owners = await this.memberships.count({
      where: { organizationId: orgId, role: Role.owner },
    });
    if (owners <= 1) {
      throw new BadRequestException('Organization must keep at least one owner');
    }
  }
}
