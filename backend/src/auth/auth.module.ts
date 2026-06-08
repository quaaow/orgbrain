import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Membership } from '../entities/membership.entity';
import { ApiKey } from '../entities/api-key.entity';
import { AuthController } from './auth.controller';
import { ApiKeyController } from './api-key.controller';
import { UsersService } from './users.service';
import { ApiKeyService } from './api-key.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OrgGuard } from './guards/org.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, Membership, ApiKey])],
  controllers: [AuthController, ApiKeyController],
  providers: [
    UsersService,
    ApiKeyService,
    JwtAuthGuard,
    OrgGuard,
    RolesGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [UsersService, ApiKeyService, OrgGuard, RolesGuard, TypeOrmModule],
})
export class AuthModule {}
