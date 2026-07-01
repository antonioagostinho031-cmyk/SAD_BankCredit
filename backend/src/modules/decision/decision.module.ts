import { Module } from '@nestjs/common';
import { DecisionService } from './decision.service';
import { DecisionRepository } from './decision.repository';
import { DecisionController } from './decision.controller';
import { AiService } from './services/ai.service';

@Module({
  controllers: [DecisionController],
  providers: [DecisionService, DecisionRepository, AiService],
  exports: [DecisionService],
})
export class DecisionModule {}
