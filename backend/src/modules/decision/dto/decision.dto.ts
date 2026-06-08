import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecisionStatus } from '../../../entities/decision.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateDecisionDto {
  @ApiProperty({ example: 'Adopt PostgreSQL as the primary datastore' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  title: string;

  @ApiPropertyOptional({ example: 'Evaluated during the platform rebuild.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'Strong relational guarantees and team familiarity.',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    example: 'Migrated in two weeks with no data loss.',
  })
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional({ enum: DecisionStatus, default: DecisionStatus.proposed })
  @IsOptional()
  @IsEnum(DecisionStatus)
  status: DecisionStatus = DecisionStatus.proposed;
}

export class UpdateDecisionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reason?: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsEnum(DecisionStatus)
  status?: DecisionStatus;
}

export class ListDecisionQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(DecisionStatus)
  status?: DecisionStatus;
}
