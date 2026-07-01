import { Injectable } from '@nestjs/common';
import { AuditRepository } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(private auditRepository: AuditRepository) {}

  async log(logData: {
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    old_values?: any;
    new_values?: any;
    ip_address?: string;
    user_agent?: string;
    details?: any;
  }) {
    try {
      return await this.auditRepository.create({
        ...logData,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erro ao registar log de auditoria:', error);
    }
  }

  async findAll(filters?: any) {
    return this.auditRepository.findAll(filters);
  }

  async findOne(id: string) {
    return this.auditRepository.findOne(id);
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.auditRepository.findByEntity(entityType, entityId);
  }

  async getActivityReport(startDate: string, endDate: string) {
    return this.auditRepository.getActivityReport(startDate, endDate);
  }

  async getUserActivity(userId: string, limit = 50) {
    return this.auditRepository.findAll({ user_id: userId, limit });
  }
}
