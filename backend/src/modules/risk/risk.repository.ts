import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class RiskRepository {
  constructor(private supabase: SupabaseService) {}

  async saveAssessment(assessment: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('risk_assessments')
      .insert([
        {
          client_id: assessment.client_id,
          credit_request_id: assessment.credit_request_id,
          risk_level: assessment.risk_level,
          risk_score: assessment.risk_score,
          debt_ratio: assessment.debt_ratio,
          payment_capacity: assessment.payment_capacity,
          max_recommended_amount: assessment.max_recommended_amount,
          risk_factors: assessment.risk_factors,
          mitigating_factors: assessment.mitigating_factors,
          assessed_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao guardar avaliação de risco:', error);
      return null;
    }
    return data;
  }

  async findByCreditId(creditId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('risk_assessments')
      .select('*')
      .eq('credit_request_id', creditId)
      .order('assessed_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }

  async findByClientId(clientId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('risk_assessments')
      .select('*')
      .eq('client_id', clientId)
      .order('assessed_at', { ascending: false });

    if (error) return [];
    return data;
  }

  async findAll(filters?: { risk_level?: string; managerId?: string }): Promise<any[]> {
    // Se for gestor, restringe aos clientes que lhe estão atribuídos
    let clientIds: string[] | null = null;
    if (filters?.managerId) {
      const { data: managed } = await this.supabase
        .from('clients')
        .select('id')
        .eq('account_manager_id', filters.managerId);
      clientIds = (managed ?? []).map((c: any) => c.id);
      if (clientIds.length === 0) return [];
    }

    let query = this.supabase
      .from('risk_assessments')
      .select('*, clients(full_name, email), credit_requests(requested_amount, term_months, purpose, status, monthly_payment)')
      .order('assessed_at', { ascending: false });

    if (filters?.risk_level) query = query.eq('risk_level', filters.risk_level);
    if (clientIds !== null)   query = query.in('client_id', clientIds);

    const { data, error } = await query;
    if (error) return [];
    return data ?? [];
  }
}
