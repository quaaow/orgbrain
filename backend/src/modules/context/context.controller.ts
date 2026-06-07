import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ContextService } from './context.service';
import { OrgGuard } from '../../auth/guards/org.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { OrgId } from '../../auth/decorators/org.decorator';
import { ContextRequestDto } from './dto/context.dto';

@ApiTags('context')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Org-Id', description: 'Active organisation id', required: true })
@UseGuards(OrgGuard, RolesGuard)
@Controller('context')
export class ContextController {
  constructor(private readonly service: ContextService) {}

  @Post()
  getContext(@Body() body: ContextRequestDto, @OrgId() orgId: string) {
    return this.service.getContext(body, orgId);
  }
}
