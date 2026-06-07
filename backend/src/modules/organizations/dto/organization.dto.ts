import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Role } from '../../../entities/membership.entity';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;
}

export class UpdateMemberRoleDto {
  @IsEnum(Role)
  role: Role;
}
