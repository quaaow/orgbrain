import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { KnowledgeType } from '../../../entities/knowledge.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateKnowledgeDto {
  @IsEnum(KnowledgeType)
  type: KnowledgeType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  importance = 0.5;
}

export class UpdateKnowledgeDto {
  @IsOptional()
  @IsEnum(KnowledgeType)
  type?: KnowledgeType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  importance?: number;
}

export class ListKnowledgeQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(KnowledgeType)
  type?: KnowledgeType;
}

export class ReviewKnowledgeDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  interval_days?: number;
}

export class SearchKnowledgeDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  top_k = 10;
}
