import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { OrgRole } from '../../auth/decorators/org.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { OrgGuard } from '../../auth/guards/org.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthUser } from '../../auth/auth.types';
import { Role } from '../../entities/membership.entity';
import {
  AddMemberDto,
  CreateOrganizationDto,
  UpdateMemberRoleDto,
} from './dto/organization.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() body: CreateOrganizationDto) {
    return this.service.create(user.userId, body.name);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.listForUser(user.userId);
  }

  @Get(':orgId/members')
  @UseGuards(OrgGuard, RolesGuard)
  @Roles(Role.viewer)
  listMembers(@Param('orgId') orgId: string) {
    return this.service.listMembers(orgId);
  }

  @Post(':orgId/members')
  @UseGuards(OrgGuard, RolesGuard)
  @Roles(Role.admin)
  @HttpCode(HttpStatus.CREATED)
  addMember(
    @Param('orgId') orgId: string,
    @Body() body: AddMemberDto,
    @OrgRole() role: Role,
  ) {
    return this.service.addMember(orgId, body, role);
  }

  @Patch(':orgId/members/:userId')
  @UseGuards(OrgGuard, RolesGuard)
  @Roles(Role.admin)
  updateMember(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body() body: UpdateMemberRoleDto,
    @OrgRole() role: Role,
  ) {
    return this.service.updateMemberRole(orgId, userId, body.role, role);
  }

  @Delete(':orgId/members/:userId')
  @UseGuards(OrgGuard, RolesGuard)
  @Roles(Role.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
  ) {
    return this.service.removeMember(orgId, userId);
  }
}
