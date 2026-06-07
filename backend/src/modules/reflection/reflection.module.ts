import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Knowledge } from '../../entities/knowledge.entity';
import { Decision } from '../../entities/decision.entity';
import { Lesson } from '../../entities/lesson.entity';
import { ReflectionRun } from '../../entities/reflection-run.entity';
import { ExtractionItem } from '../../entities/extraction-item.entity';
import { LinksModule } from '../links/links.module';
import { ReflectionController } from './reflection.controller';
import { ReflectionService } from './reflection.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Knowledge,
      Decision,
      Lesson,
      ReflectionRun,
      ExtractionItem,
    ]),
    LinksModule,
  ],
  controllers: [ReflectionController],
  providers: [ReflectionService],
})
export class ReflectionModule {}
