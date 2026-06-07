import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { OrgGuard } from '../../auth/guards/org.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { OrgId } from '../../auth/decorators/org.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../entities/membership.entity';
import { AuthUser } from '../../auth/auth.types';
import {
  CreateKnowledgeDto,
  ListKnowledgeQueryDto,
  ReviewKnowledgeDto,
  SearchKnowledgeDto,
  UpdateKnowledgeDto,
} from './dto/knowledge.dto';

@ApiTags('knowledge')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Org-Id', description: 'Active organisation id', required: true })
@UseGuards(OrgGuard, RolesGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly service: KnowledgeService) {}

  @Post()
  @Roles(Role.member)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() body: CreateKnowledgeDto,
    @OrgId() orgId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(body, orgId, user.userId);
  }

  @Get()
  list(@OrgId() orgId: string, @Query() query: ListKnowledgeQueryDto) {
    return this.service.list(orgId, query);
  }

  @Get('stale')
  listStale(@OrgId() orgId: string, @Query() query: ListKnowledgeQueryDto) {
    return this.service.listStale(orgId, query.limit, query.offset);
  }

  @Post('search')
  search(@Body() body: SearchKnowledgeDto, @OrgId() orgId: string) {
    return this.service.search(body, orgId);
  }

  @Post(':id/review')
  @Roles(Role.member)
  review(
    @Param('id') id: string,
    @Body() body: ReviewKnowledgeDto,
    @OrgId() orgId: string,
  ) {
    return this.service.markReviewed(id, orgId, body);
  }

  @Get(':id')
  get(@Param('id') id: string, @OrgId() orgId: string) {
    return this.service.get(id, orgId);
  }

  @Put(':id')
  @Roles(Role.member)
  update(
    @Param('id') id: string,
    @Body() body: UpdateKnowledgeDto,
    @OrgId() orgId: string,
  ) {
    return this.service.update(id, body, orgId);
  }

  @Delete(':id')
  @Roles(Role.member)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @OrgId() orgId: string) {
    return this.service.remove(id, orgId);
  }
}
