import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ClientsModule } from '../clients/clients.module';
import { CreditModule } from '../credit/credit.module';

@Module({
  imports: [ClientsModule, CreditModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
