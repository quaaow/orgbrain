import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExtractionStatus } from '../../../entities/extraction-item.entity';

export class ReflectRequestDto {
  @ApiProperty({
    example:
      'In the Q3 retro we decided to drop the legacy billing API because it caused 40% of incidents. The lesson: migrate integrations before deprecating an endpoint.',
    description: 'Free text to extract facts, decisions and lessons from.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15000, {
    message: 'Text is too long. Maximum 15000 characters (~3000 words). Split into smaller parts.',
  })
  text: string;
}

export class ApplyRunDto {
  /** Optional subset of extraction item ids to materialise. */
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  item_ids?: string[];
}

export class ReviewItemDto {
  @IsIn([ExtractionStatus.approved, ExtractionStatus.rejected], {
    message: 'status must be one of: approved, rejected',
  })
  status: ExtractionStatus.approved | ExtractionStatus.rejected;
}

export class ListRunsQueryDto {
  @IsOptional()
  @Type(() => Number)
  limit = 20;

  @IsOptional()
  @Type(() => Number)
  offset = 0;
}
