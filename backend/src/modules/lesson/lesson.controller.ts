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
import { LessonService } from './lesson.service';
import { OrgGuard } from '../../auth/guards/org.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { OrgId } from '../../auth/decorators/org.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../entities/membership.entity';
import { AuthUser } from '../../auth/auth.types';
import {
  CreateLessonDto,
  ListLessonQueryDto,
  UpdateLessonDto,
} from './dto/lesson.dto';

@ApiTags('lessons')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Org-Id', description: 'Active organisation id', required: true })
@UseGuards(OrgGuard, RolesGuard)
@Controller('lessons')
export class LessonController {
  constructor(private readonly service: LessonService) {}

  @Post()
  @Roles(Role.member)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() body: CreateLessonDto,
    @OrgId() orgId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(body, orgId, user.userId);
  }

  @Get()
  list(@OrgId() orgId: string, @Query() query: ListLessonQueryDto) {
    return this.service.list(orgId, query);
  }

  @Get(':id')
  get(@Param('id') id: string, @OrgId() orgId: string) {
    return this.service.get(id, orgId);
  }

  @Put(':id')
  @Roles(Role.member)
  update(
    @Param('id') id: string,
    @Body() body: UpdateLessonDto,
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
