import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityLink } from '../../entities/entity-link.entity';
import { Knowledge } from '../../entities/knowledge.entity';
import { Decision } from '../../entities/decision.entity';
import { Lesson } from '../../entities/lesson.entity';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';

@Module({
  imports: [TypeOrmModule.forFeature([EntityLink, Knowledge, Decision, Lesson])],
  controllers: [LinksController],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule {}
