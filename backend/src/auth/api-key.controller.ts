import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrgGuard } from './guards/org.guard';
import { RolesGuard } from './guards/roles.guard';
import { OrgId, OrgRole } from './decorators/org.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { Role } from '../entities/membership.entity';
import { AuthUser } from './auth.types';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/api-key.dto';

@ApiTags('api-keys')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Org-Id',
  description: 'Active organisation id',
  required: true,
})
@UseGuards(OrgGuard, RolesGuard)
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly service: ApiKeyService) {}

  @Post()
  @Roles(Role.admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an API key. The raw key is returned only in this response.',
  })
  create(
    @Body() body: CreateApiKeyDto,
    @OrgId() orgId: string,
    @OrgRole() role: Role,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(orgId, user.userId, role, body);
  }

  @Get()
  @Roles(Role.admin)
  list(@OrgId() orgId: string) {
    return this.service.list(orgId);
  }

  @Delete(':id')
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Revoke an API key (irreversible).' })
  revoke(@Param('id') id: string, @OrgId() orgId: string) {
    return this.service.revoke(id, orgId);
  }
}
