import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { CreditRequest, CreditAnalysis } from './entities/credit.entity';

@Injectable()
export class CreditRepository {
  constructor(private supabase: SupabaseService) {}

  async create(data: any): Promise<CreditRequest> {
    const { data: result, error } = await this.supabase
      .from('credit_requests')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async findAll(filters?: any): Promise<CreditRequest[]> {
    // Se for gestor, restringe aos clientes que lhe estão atribuídos
    if (filters?.managerId) {
      const { data: managed } = await this.supabase
        .from('clients')
        .select('id')
        .eq('account_manager_id', filters.managerId);
      const ids = (managed ?? []).map((c: any) => c.id);
      if (ids.length === 0) return [];
      filters = { ...filters, _clientIds: ids };
    }

    let query = this.supabase
      .from('credit_requests')
      .select(`*, clients(full_name, bi_number, monthly_income)`)
      .order('created_at', { ascending: false });

    if (filters?.status)     query = query.eq('status', filters.status);
    if (filters?.client_id)  query = query.eq('client_id', filters.client_id);
    if (filters?.analyst_id) query = query.eq('analyst_id', filters.analyst_id);
    if (filters?._clientIds) query = query.in('client_id', filters._clientIds);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findOne(id: string): Promise<CreditRequest> {
    const { data, error } = await this.supabase
      .from('credit_requests')
      .select(`*, clients(*)`)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findByClientId(clientId: string): Promise<CreditRequest[]> {
    const { data, error } = await this.supabase
      .from('credit_requests')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async update(id: string, data: any): Promise<CreditRequest> {
    const { data: result, error } = await this.supabase
      .from('credit_requests')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async createAnalysis(data: any): Promise<CreditAnalysis> {
    const { data: result, error } = await this.supabase
      .from('credit_analysis')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async findAnalysisByCreditId(creditId: string): Promise<CreditAnalysis[]> {
    const { data, error } = await this.supabase
      .from('credit_analysis')
      .select('*')
      .eq('credit_request_id', creditId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async updateAnalysis(id: string, data: any): Promise<CreditAnalysis> {
    const { data: result, error } = await this.supabase
      .from('credit_analysis')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async countByStatus(): Promise<any> {
    const { data, error } = await this.supabase
      .from('credit_requests')
      .select('status');

    if (error) throw error;

    const counts: any = {};
    data.forEach(row => {
      counts[row.status] = (counts[row.status] || 0) + 1;
    });
    return counts;
  }

  async getTotalAmountApproved(): Promise<number> {
    const { data, error } = await this.supabase
      .from('credit_requests')
      .select('approved_amount')
      .eq('status', 'aprovado');

    if (error) throw error;
    return data.reduce((sum, row) => sum + (row.approved_amount || 0), 0);
  }
}
