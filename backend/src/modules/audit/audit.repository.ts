import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { AuditLog } from './entities/audit.entity';

@Injectable()
export class AuditRepository {
  constructor(private supabase: SupabaseService) {}

  async create(auditData: any): Promise<AuditLog> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .insert([auditData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(filters?: any): Promise<AuditLog[]> {
    let query = this.supabase
      .from('audit_logs')
      .select('*, users(name)')
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 100);

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    if (filters?.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }

    if (filters?.entity_id) {
      query = query.eq('entity_id', filters.entity_id);
    }

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findOne(id: string): Promise<AuditLog> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getActivityReport(startDate: string, endDate: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('action, entity_type, user_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;

    const summary = {
      total_actions: data.length,
      by_action: {},
      by_entity_type: {},
      by_user: {},
    };

    data.forEach(log => {
      summary.by_action[log.action] = (summary.by_action[log.action] || 0) + 1;
      summary.by_entity_type[log.entity_type] = (summary.by_entity_type[log.entity_type] || 0) + 1;
      summary.by_user[log.user_id] = (summary.by_user[log.user_id] || 0) + 1;
    });

    return summary;
  }
}
