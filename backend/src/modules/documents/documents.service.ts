import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentsRepository } from './documents.repository';
import { AuditService } from '../audit/audit.service';
import { ClientsService } from '../clients/clients.service';

@Injectable()
export class DocumentsService {
  constructor(
    private documentsRepository: DocumentsRepository,
    private auditService: AuditService,
    private clientsService: ClientsService,
  ) {}

  async uploadDocument(file: any, uploadData: any, userId: string) {
    try {
      const fileName = `${Date.now()}_${file.originalname}`;
      const filePath = `${uploadData.client_id}/${uploadData.document_type}/${fileName}`;

      const storedPath = await this.documentsRepository.uploadFile(file.buffer, filePath);

      const document = await this.documentsRepository.create({
        client_id:     uploadData.client_id,
        document_type: uploadData.document_type,
        file_name:     file.originalname,
        file_path:     storedPath,
        file_size:     file.size,
        mime_type:     file.mimetype,
        status:        'pendente',
        expiry_date:   uploadData.expiry_date || null,
      });

      await this.auditService.log({
        user_id:     userId,
        action:      'document_upload',
        entity_type: 'document',
        entity_id:   document.id,
        details:     { document_type: uploadData.document_type },
      });

      return document;
    } catch (error: any) {
      throw new BadRequestException(`Erro ao fazer upload do documento: ${error.message}`);
    }
  }

  async findAll(filters?: any) {
    return this.documentsRepository.findAll(filters);
  }

  async findOne(id: string) {
    const document = await this.documentsRepository.findOne(id);
    if (!document) throw new NotFoundException('Documento não encontrado');
    return document;
  }

  async findByClientId(clientId: string) {
    return this.documentsRepository.findByClientId(clientId);
  }

  /**
   * Validação manual pelo gestor/analista.
   * Após aprovação ou rejeição, reavalia automaticamente a elegibilidade.
   */
  async validateDocument(documentId: string, status: string, userId: string, notes?: string) {
    const document = await this.findOne(documentId);

    const updatedDocument = await this.documentsRepository.updateStatus(
      documentId,
      status,
      userId,
      notes,
    );

    await this.auditService.log({
      user_id:     userId,
      action:      'document_validation',
      entity_type: 'document',
      entity_id:   documentId,
      details:     { status, notes },
    });

    // Mudança de estado de um documento (aprovado/rejeitado) pode alterar elegibilidade
    if (status === 'aprovado' || status === 'rejeitado') {
      await this.clientsService.evaluateEligibility(document.client_id).catch(err =>
        console.error('Erro ao reavaliar elegibilidade após validação de documento:', err),
      );
    }

    return updatedDocument;
  }

  async getDocumentValidations(documentId: string) {
    await this.findOne(documentId);
    return this.documentsRepository.findValidationsByDocumentId(documentId);
  }

  async remove(id: string, userId: string) {
    const document = await this.findOne(id);

    await this.documentsRepository.deleteFile(document.file_path);
    await this.documentsRepository.remove(id);

    await this.auditService.log({
      user_id:     userId,
      action:      'document_delete',
      entity_type: 'document',
      entity_id:   id,
      details:     { file_name: document.file_name },
    });

    // Documento removido pode retirar elegibilidade
    await this.clientsService.evaluateEligibility(document.client_id).catch(err =>
      console.error('Erro ao reavaliar elegibilidade após remoção de documento:', err),
    );
  }

  async getDocumentUrl(id: string) {
    const document = await this.findOne(id);
    return this.documentsRepository.getFileUrl(document.file_path);
  }

  async getClientDocumentsSummary(clientId: string) {
    const documents = await this.findByClientId(clientId);

    const summary: any = {
      total:    documents.length,
      approved: documents.filter(d => d.status === 'aprovado').length,
      pending:  documents.filter(d => d.status === 'pendente').length,
      rejected: documents.filter(d => d.status === 'rejeitado').length,
      by_type:  {},
    };

    documents.forEach(doc => {
      if (!summary.by_type[doc.document_type]) {
        summary.by_type[doc.document_type] = { count: 0, approved: 0, pending: 0 };
      }
      summary.by_type[doc.document_type].count++;
      if (doc.status === 'aprovado') summary.by_type[doc.document_type].approved++;
      if (doc.status === 'pendente')  summary.by_type[doc.document_type].pending++;
    });

    return summary;
  }
}
