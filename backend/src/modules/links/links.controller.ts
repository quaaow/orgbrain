import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { LinksService } from './links.service';
import { OrgGuard } from '../../auth/guards/org.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { OrgId } from '../../auth/decorators/org.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../entities/membership.entity';
import { AuthUser } from '../../auth/auth.types';
import { CreateLinkDto, ListLinksQueryDto } from './dto/link.dto';

@ApiTags('graph')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Org-Id', description: 'Active organisation id', required: true })
@UseGuards(OrgGuard, RolesGuard)
@Controller()
export class LinksController {
  constructor(private readonly service: LinksService) {}

  @Post('links')
  @Roles(Role.member)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() body: CreateLinkDto,
    @OrgId() orgId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(body, orgId, user.userId);
  }

  @Get('links')
  list(@OrgId() orgId: string, @Query() query: ListLinksQueryDto) {
    return this.service.list(orgId, query);
  }

  @Delete('links/:id')
  @Roles(Role.member)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @OrgId() orgId: string) {
    return this.service.remove(id, orgId);
  }

  @Get('graph')
  graph(@OrgId() orgId: string) {
    return this.service.graph(orgId);
  }
}
