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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KnowledgeType } from '../../../entities/knowledge.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateKnowledgeDto {
  @ApiProperty({ enum: KnowledgeType, example: KnowledgeType.fact })
  @IsEnum(KnowledgeType)
  type: KnowledgeType;

  @ApiProperty({ example: 'Standard payment terms are net-30' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  title: string;

  @ApiProperty({
    example:
      'Unless negotiated otherwise, customer invoices are due 30 days after issue.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 1,
    default: 0.5,
    example: 0.8,
    description: 'Relative importance, 0–1.',
  })
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
  @ApiProperty({ example: 'what are our payment terms?' })
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
