import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  problem: string;

  @IsString()
  @IsNotEmpty()
  solution: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence = 0.5;

  @IsOptional()
  @IsString()
  decision_id?: string;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  problem?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  solution?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @IsOptional()
  @IsString()
  decision_id?: string;
}

export class ListLessonQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  decision_id?: string;
}
