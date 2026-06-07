import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DecisionStatus } from '../../../entities/decision.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateDecisionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  outcome?: string;

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
