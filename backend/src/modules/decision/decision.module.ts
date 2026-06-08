import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Decision } from '../../entities/decision.entity';
import { DecisionController } from './decision.controller';
import { DecisionService } from './decision.service';

@Module({
  imports: [TypeOrmModule.forFeature([Decision])],
  controllers: [DecisionController],
  providers: [DecisionService],
  exports: [DecisionService],
})
export class DecisionModule {}
