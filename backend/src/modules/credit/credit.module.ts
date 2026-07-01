import { Module } from '@nestjs/common';
import { CreditController } from './credit.controller';
import { CreditService } from './credit.service';
import { CreditRepository } from './credit.repository';
import { ClientsModule } from '../clients/clients.module';
import { ScoringModule } from '../scoring/scoring.module';
import { RiskModule } from '../risk/risk.module';
import { DecisionModule } from '../decision/decision.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ClientsModule,
    ScoringModule,
    RiskModule,
    DecisionModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [CreditController],
  providers: [CreditService, CreditRepository],
  exports: [CreditService],
})
export class CreditModule {}
