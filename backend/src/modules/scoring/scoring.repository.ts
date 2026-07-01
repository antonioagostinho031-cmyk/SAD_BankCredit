import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class ScoringRepository {
  constructor(private supabase: SupabaseService) {}

  // ── Score persistence ─────────────────────────────────────

  async saveScore(scoreData: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('credit_scores')
      .insert([{
        client_id:            scoreData.client_id,
        total_score:          scoreData.total_score,
        financial_score:      scoreData.financial_score,
        behavioral_score:     scoreData.behavioral_score,
        document_score:       scoreData.document_score,
        credit_history_score: scoreData.credit_history_score,
        risk_level:           scoreData.risk_level,
        details:              scoreData.details,
        calculated_at:        new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) { console.error('Erro ao guardar score:', error); return null; }
    return data;
  }

  async getLatestScore(clientId: string): Promise<any> {
    const { data } = await this.supabase
      .from('credit_scores')
      .select('*')
      .eq('client_id', clientId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();
    return data ?? null;
  }

  async getScoreHistory(clientId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('credit_scores')
      .select('*')
      .eq('client_id', clientId)
      .order('calculated_at', { ascending: false });
    return data ?? [];
  }

  // ── Historical data fetchers ──────────────────────────────

  /** Últimos N meses de rendimentos registados */
  async getIncomeRecords(clientId: string, months = 12): Promise<any[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const sinceStr = since.toISOString().slice(0, 7); // 'YYYY-MM'

    const { data } = await this.supabase
      .from('income_records')
      .select('month, gross_income, net_income, source')
      .eq('client_id', clientId)
      .gte('month', sinceStr)
      .order('month', { ascending: false });

    return data ?? [];
  }

  /** Transacções dos últimos N meses */
  async getTransactions(clientId: string, months = 12): Promise<any[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const { data } = await this.supabase
      .from('transactions')
      .select('transaction_type, amount, balance_after, description, transaction_date')
      .eq('client_id', clientId)
      .gte('transaction_date', since.toISOString())
      .order('transaction_date', { ascending: false });

    return data ?? [];
  }

  /** Todas as prestações do cliente (via credit_requests) */
  async getLoanInstallments(clientId: string): Promise<any[]> {
    const { data: requests } = await this.supabase
      .from('credit_requests')
      .select('id')
      .eq('client_id', clientId);

    if (!requests || requests.length === 0) return [];

    const requestIds = (requests as any[]).map(r => r.id);

    const { data } = await this.supabase
      .from('loan_installments')
      .select('credit_request_id, installment_number, due_date, amount, paid_at, paid_amount, status, days_late')
      .in('credit_request_id', requestIds)
      .order('due_date', { ascending: false });

    return data ?? [];
  }

  /** Dívidas externas */
  async getExternalDebts(clientId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('external_debts')
      .select('creditor, debt_type, current_balance, monthly_payment, status')
      .eq('client_id', clientId);

    return data ?? [];
  }

  /** Contas bancárias activas */
  async getBankAccounts(clientId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('bank_accounts')
      .select('account_type, balance, opened_at, is_active')
      .eq('client_id', clientId)
      .eq('is_active', true);

    return data ?? [];
  }

  /** Vínculo laboral */
  async getEmploymentData(clientId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('employment_data')
      .select('employer_name, employment_type, start_date, is_current, monthly_income')
      .eq('client_id', clientId)
      .order('start_date', { ascending: false });

    return data ?? [];
  }

  /**
   * Documento de rendimento aprovado mais recente — usado para usar o rendimento
   * verificado como base primária de scoring quando disponível.
   */
  async getApprovedIncomeDocument(clientId: string): Promise<any | null> {
    // Buscar documento aprovado de comprovativo de rendimento ou vínculo
    const { data: docs } = await this.supabase
      .from('documents')
      .select('id, document_type, validated_at, confidence_score')
      .eq('client_id', clientId)
      .eq('status', 'aprovado')
      .in('document_type', ['comprovativo_rendimento', 'comprovativo_vinculo'])
      .order('validated_at', { ascending: false })
      .limit(1);

    if (!docs || docs.length === 0) return null;

    // Buscar extracted_data da validação
    const { data: validations } = await this.supabase
      .from('document_validations')
      .select('extracted_data, confidence_score')
      .eq('document_id', docs[0].id)
      .eq('is_valid', true)
      .order('validation_date', { ascending: false })
      .limit(1);

    return {
      ...docs[0],
      extracted_data: validations?.[0]?.extracted_data ?? null,
    };
  }

  /** Historial de crédito — mantido para compatibilidade */
  async getCreditHistory(clientId: string): Promise<{ total: number; completed: number; defaults: number }> {
    const { data } = await this.supabase
      .from('credit_requests')
      .select('status')
      .eq('client_id', clientId);

    if (!data) return { total: 0, completed: 0, defaults: 0 };

    return {
      total:     data.length,
      completed: (data as any[]).filter(r => r.status === 'desembolsado').length,
      defaults:  (data as any[]).filter(r => r.status === 'rejeitado').length,
    };
  }
}
