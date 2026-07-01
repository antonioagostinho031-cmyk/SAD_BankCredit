import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { ScoringRepository } from './scoring.repository';
import { ScoringController } from './scoring.controller';

@Module({
  controllers: [ScoringController],
  providers: [ScoringService, ScoringRepository],
  exports: [ScoringService, ScoringRepository],
})
export class ScoringModule {}
