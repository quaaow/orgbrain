import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Membership } from '../entities/membership.entity';
import { AuthController } from './auth.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OrgGuard } from './guards/org.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, Membership])],
  controllers: [AuthController],
  providers: [
    UsersService,
    JwtAuthGuard,
    OrgGuard,
    RolesGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [UsersService, OrgGuard, RolesGuard, TypeOrmModule],
})
export class AuthModule {}
