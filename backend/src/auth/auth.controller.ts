import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from '../entities/membership.entity';
import { UsersService } from './users.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUser } from './auth.types';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly users: UsersService,
    @InjectRepository(Membership)
    private readonly memberships: Repository<Membership>,
  ) {}

  /** Current user profile plus the organisations they belong to. */
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const profile = await this.users.findById(user.userId);
    const memberships = await this.memberships.find({
      where: { userId: user.userId },
      relations: { organization: true },
      order: { createdAt: 'ASC' },
    });

    return {
      user: profile
        ? profile.toDict()
        : { id: user.userId, email: user.email },
      memberships: memberships.map((m) => ({
        organization: m.organization?.toDict() ?? { id: m.organizationId },
        role: m.role,
      })),
    };
  }
}
