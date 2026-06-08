import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Role } from '../../entities/membership.entity';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'CI pipeline' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    enum: Role,
    default: Role.member,
    description: 'Permission ceiling for the key (cannot exceed the creator).',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    example: '2027-01-01T00:00:00.000Z',
    description: 'Optional expiry; omit for a non-expiring key.',
  })
  @IsOptional()
  @IsISO8601()
  expires_at?: string;
}
