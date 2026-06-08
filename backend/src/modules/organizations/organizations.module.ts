import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../../entities/organization.entity';
import { Membership } from '../../entities/membership.entity';
import { User } from '../../entities/user.entity';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { DemoSeedService } from './demo-seed.service';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { DecisionModule } from '../decision/decision.module';
import { LessonModule } from '../lesson/lesson.module';
import { LinksModule } from '../links/links.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, Membership, User]),
    KnowledgeModule,
    DecisionModule,
    LessonModule,
    LinksModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, DemoSeedService],
})
export class OrganizationsModule {}
