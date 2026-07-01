import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientsRepository } from './clients.repository';
import { ClientsFinancialService } from './clients-financial.service';
import { ClientsUpdateSimpleService } from './clients-update-simple.service';

@Module({
  imports: [],  // Removido DocumentsModule (não precisa mais de OCR)
  controllers: [ClientsController],
  providers: [
    ClientsService,
    ClientsRepository,
    ClientsFinancialService,
    ClientsUpdateSimpleService,
  ],
  exports: [ClientsService, ClientsUpdateSimpleService],
})
export class ClientsModule {}
