import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ReflectionService } from './reflection.service';
import { OrgGuard } from '../../auth/guards/org.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { OrgId } from '../../auth/decorators/org.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../entities/membership.entity';
import { AuthUser } from '../../auth/auth.types';
import {
  ApplyRunDto,
  ListRunsQueryDto,
  ReflectRequestDto,
  ReviewItemDto,
} from './dto/reflection.dto';

@ApiTags('reflection')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Org-Id', description: 'Active organisation id', required: true })
@UseGuards(OrgGuard, RolesGuard)
@Controller('reflect')
export class ReflectionController {
  constructor(private readonly service: ReflectionService) {}

  /** Extract structured candidates from text and stage them for review. */
  @Post()
  @Roles(Role.member)
  reflect(
    @Body() body: ReflectRequestDto,
    @OrgId() orgId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reflect(body, orgId, user.userId);
  }

  @Get('runs')
  listRuns(@OrgId() orgId: string, @Query() query: ListRunsQueryDto) {
    return this.service.listRuns(orgId, query.limit, query.offset);
  }

  @Get('runs/:id')
  getRun(@Param('id') id: string, @OrgId() orgId: string) {
    return this.service.getRun(id, orgId);
  }

  /** Approve or reject a single staged item. */
  @Patch('items/:id')
  @Roles(Role.member)
  reviewItem(
    @Param('id') id: string,
    @Body() body: ReviewItemDto,
    @OrgId() orgId: string,
  ) {
    return this.service.reviewItem(id, orgId, body);
  }

  /** Materialise approved/pending items into the knowledge base. */
  @Post('runs/:id/apply')
  @Roles(Role.member)
  applyRun(
    @Param('id') id: string,
    @Body() body: ApplyRunDto,
    @OrgId() orgId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.applyRun(id, orgId, user.userId, body.item_ids);
  }

  @Post('runs/:id/discard')
  @Roles(Role.member)
  discardRun(@Param('id') id: string, @OrgId() orgId: string) {
    return this.service.discardRun(id, orgId);
  }
}
