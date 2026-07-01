import { Module } from '@nestjs/common';
import { RiskService } from './risk.service';
import { RiskRepository } from './risk.repository';
import { RiskController } from './risk.controller';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [ScoringModule],
  controllers: [RiskController],
  providers: [RiskService, RiskRepository],
  exports: [RiskService],
})
export class RiskModule {}
