import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';
import { AuditModule } from '../audit/audit.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [AuditModule, ClientsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsRepository],
  exports: [DocumentsService, DocumentsRepository],
})
export class DocumentsModule {}
