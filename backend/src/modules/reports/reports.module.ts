import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ClientsModule } from '../clients/clients.module';
import { CreditModule } from '../credit/credit.module';

@Module({
  imports: [ClientsModule, CreditModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
