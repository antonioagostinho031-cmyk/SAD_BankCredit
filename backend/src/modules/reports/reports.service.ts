import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class ReportsService {
  constructor(private supabase: SupabaseService) {}

  private async getClientIdsForManager(managerId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('clients')
      .select('id')
      .eq('account_manager_id', managerId);
    return (data ?? []).map((c: any) => c.id);
  }

  async generateCreditReport(filters: any, managerId?: string) {
    let clientIds: string[] | null = null;
    if (managerId) {
      clientIds = await this.getClientIdsForManager(managerId);
      if (clientIds.length === 0) return this.formatCreditReport([]);
    }

    let query = this.supabase
      .from('credit_requests')
      .select(`
        *,
        clients(full_name, bi_number, monthly_income, employer),
        credit_analysis(overall_score, recommendation)
      `)
      .order('created_at', { ascending: false });

    if (filters.start_date) query = query.gte('submission_date', filters.start_date);
    if (filters.end_date) query = query.lte('submission_date', filters.end_date);
    if (filters.status) query = query.eq('status', filters.status);
    if (clientIds) query = query.in('client_id', clientIds);

    const { data, error } = await query;
    if (error) throw error;

    return this.formatCreditReport(data);
  }

  async generateClientReport(filters: any, managerId?: string) {
    let query = this.supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.registration_status) {
      query = query.eq('registration_status', filters.registration_status);
    }
    if (managerId) {
      query = query.eq('account_manager_id', managerId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return this.formatClientReport(data);
  }

  async generateRiskReport(filters: any, managerId?: string) {
    let clientIds: string[] | null = null;
    if (managerId) {
      clientIds = await this.getClientIdsForManager(managerId);
      if (clientIds.length === 0) return this.formatRiskReport([]);
    }

    let query = this.supabase
      .from('risk_assessments')
      .select(`*, clients(full_name)`)
      .order('assessed_at', { ascending: false });

    if (clientIds) query = query.in('client_id', clientIds);

    const { data, error } = await query;
    if (error) throw error;
    return this.formatRiskReport(data);
  }

  async generateDocumentReport(filters: any, managerId?: string) {
    let clientIds: string[] | null = null;
    if (managerId) {
      clientIds = await this.getClientIdsForManager(managerId);
      if (clientIds.length === 0) return this.formatDocumentReport([]);
    }

    let query = this.supabase
      .from('documents')
      .select(`*, clients(full_name)`)
      .order('uploaded_at', { ascending: false });

    if (clientIds) query = query.in('client_id', clientIds);

    const { data, error } = await query;
    if (error) throw error;
    return this.formatDocumentReport(data);
  }

  private formatCreditReport(data: any[]) {
    const summary = {
      total: data.length,
      by_status: {} as any,
      total_requested: 0,
      total_approved: 0,
      average_score: 0,
    };

    let totalScore = 0;
    let scoredCount = 0;

    data.forEach(r => {
      summary.by_status[r.status] = (summary.by_status[r.status] || 0) + 1;
      summary.total_requested += r.requested_amount || 0;
      summary.total_approved += r.approved_amount || 0;

      if (r.credit_analysis?.length > 0) {
        totalScore += r.credit_analysis[0].overall_score || 0;
        scoredCount++;
      }
    });

    summary.average_score = scoredCount > 0
      ? Math.round(totalScore / scoredCount)
      : 0;

    return {
      summary,
      data: data.map(r => ({
        id: r.id,
        client: r.clients?.full_name,
        bi: r.clients?.bi_number,
        income: r.clients?.monthly_income,
        requested_amount: r.requested_amount,
        approved_amount: r.approved_amount,
        term_months: r.term_months,
        status: r.status,
        purpose: r.purpose,
        submission_date: r.submission_date,
        decision_date: r.decision_date,
        score: r.credit_analysis?.[0]?.overall_score,
      })),
    };
  }

  private formatClientReport(data: any[]) {
    return {
      summary: {
        total: data.length,
        eligible: data.filter(c => c.is_eligible_for_credit).length,
        by_status: data.reduce((acc, c) => {
          acc[c.registration_status] = (acc[c.registration_status] || 0) + 1;
          return acc;
        }, {}),
      },
      data: data.map(c => ({
        id: c.id,
        name: c.full_name,
        bi: c.bi_number,
        nif: c.nif,
        income: c.monthly_income,
        employer: c.employer,
        status: c.registration_status,
        eligible: c.is_eligible_for_credit,
        created_at: c.created_at,
      })),
    };
  }

  private formatRiskReport(data: any[]) {
    return {
      summary: {
        total: data.length,
        by_risk_level: data.reduce((acc, r) => {
          acc[r.risk_level] = (acc[r.risk_level] || 0) + 1;
          return acc;
        }, {}),
        average_debt_ratio: data.length > 0
          ? data.reduce((sum, r) => sum + (r.debt_ratio || 0), 0) / data.length
          : 0,
      },
      data: data.map(r => ({
        id: r.id,
        client: r.clients?.full_name,
        risk_level: r.risk_level,
        risk_score: r.risk_score,
        debt_ratio: r.debt_ratio,
        payment_capacity: r.payment_capacity,
        assessed_at: r.assessed_at,
      })),
    };
  }

  private formatDocumentReport(data: any[]) {
    return {
      summary: {
        total: data.length,
        by_status: data.reduce((acc, d) => {
          acc[d.status] = (acc[d.status] || 0) + 1;
          return acc;
        }, {}),
        by_type: data.reduce((acc, d) => {
          acc[d.document_type] = (acc[d.document_type] || 0) + 1;
          return acc;
        }, {}),
        average_confidence: data.length > 0
          ? data.reduce((sum, d) => sum + (d.confidence_score || 0), 0) / data.length
          : 0,
      },
      data: data.map(d => ({
        id: d.id,
        client: d.clients?.full_name,
        type: d.document_type,
        status: d.status,
        confidence: d.confidence_score,
        uploaded_at: d.uploaded_at,
        validated_at: d.validated_at,
      })),
    };
  }
}
