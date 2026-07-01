import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class DashboardService {
  constructor(private supabase: SupabaseService) {}

  // ── Helper: IDs dos clientes atribuídos a um gestor ──────────────────────
  private async getClientIdsForManager(managerId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('clients')
      .select('id')
      .eq('account_manager_id', managerId);
    return (data ?? []).map((c: any) => c.id);
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  async getExecutiveSummary(managerId?: string) {
    const [clients, credits, documents] = await Promise.all([
      this.getClientStats(managerId),
      this.getCreditStats(managerId),
      this.getDocumentStats(managerId),
    ]);
    return { clients, credits, documents };
  }

  // ── Client stats ──────────────────────────────────────────────────────────

  async getClientStats(managerId?: string) {
    let query = this.supabase
      .from('clients')
      .select('registration_status, is_eligible_for_credit');

    if (managerId) query = query.eq('account_manager_id', managerId);

    const { data, error } = await query;
    if (error) return { total: 0, by_status: {}, eligible: 0 };

    const total = data.length;
    const eligible = data.filter((c: any) => c.is_eligible_for_credit).length;
    const by_status: any = {};
    data.forEach((c: any) => {
      by_status[c.registration_status] = (by_status[c.registration_status] || 0) + 1;
    });
    return { total, eligible, by_status };
  }

  // ── Credit stats ──────────────────────────────────────────────────────────

  async getCreditStats(managerId?: string) {
    let clientIds: string[] | null = null;
    if (managerId) {
      clientIds = await this.getClientIdsForManager(managerId);
      if (clientIds.length === 0)
        return { total: 0, by_status: {}, total_requested: 0, total_approved: 0, approval_rate: 0, pending: 0 };
    }

    let query = this.supabase
      .from('credit_requests')
      .select('status, requested_amount, approved_amount, client_id');

    if (clientIds) query = query.in('client_id', clientIds);

    const { data, error } = await query;
    if (error) return { total: 0, by_status: {}, total_requested: 0, total_approved: 0, approval_rate: 0, pending: 0 };

    const total = data.length;
    const by_status: any = {};
    let total_requested = 0;
    let total_approved  = 0;

    data.forEach((c: any) => {
      by_status[c.status] = (by_status[c.status] || 0) + 1;
      total_requested += c.requested_amount || 0;
      total_approved  += c.approved_amount  || 0;
    });

    const approval_rate = total > 0 ? ((by_status['aprovado'] || 0) / total) * 100 : 0;

    return {
      total,
      by_status,
      total_requested,
      total_approved,
      approval_rate: Math.round(approval_rate * 10) / 10,
      pending: (by_status['submetido'] || 0) + (by_status['em_analise'] || 0),
    };
  }

  // ── Document stats ────────────────────────────────────────────────────────

  async getDocumentStats(managerId?: string) {
    let clientIds: string[] | null = null;
    if (managerId) {
      clientIds = await this.getClientIdsForManager(managerId);
      if (clientIds.length === 0) return { total: 0, by_status: {} };
    }

    let query = this.supabase.from('documents').select('status, document_type, client_id');
    if (clientIds) query = query.in('client_id', clientIds);

    const { data, error } = await query;
    if (error) return { total: 0, by_status: {} };

    const total = data.length;
    const by_status: any = {};
    data.forEach((d: any) => {
      by_status[d.status] = (by_status[d.status] || 0) + 1;
    });
    return { total, by_status };
  }

  // ── Recent activity ───────────────────────────────────────────────────────
  // audit_logs não tem client_id directo — para gestor mostra actividade
  // filtrada pelo entity_type 'client' com entity_id nos seus clientes

  async getRecentActivity(limit = 10, managerId?: string) {
    if (managerId) {
      const clientIds = await this.getClientIdsForManager(managerId);
      if (clientIds.length === 0) return [];

      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .in('entity_id', clientIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return [];
      return data ?? [];
    }

    const { data, error } = await this.supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data;
  }

  // ── Credit trend ──────────────────────────────────────────────────────────

  async getCreditTrend(months = 6, managerId?: string) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    let clientIds: string[] | null = null;
    if (managerId) {
      clientIds = await this.getClientIdsForManager(managerId);
      if (clientIds.length === 0) return [];
    }

    let query = this.supabase
      .from('credit_requests')
      .select('status, requested_amount, approved_amount, submission_date, client_id')
      .gte('submission_date', startDate.toISOString());

    if (clientIds) query = query.in('client_id', clientIds);

    const { data, error } = await query;
    if (error) return [];

    const monthly: any = {};
    data.forEach((c: any) => {
      const month = new Date(c.submission_date).toLocaleDateString('pt-AO', {
        month: 'short', year: '2-digit',
      });
      if (!monthly[month]) monthly[month] = { submitted: 0, approved: 0, rejected: 0, amount: 0 };
      monthly[month].submitted++;
      if (c.status === 'aprovado') { monthly[month].approved++; monthly[month].amount += c.approved_amount || 0; }
      if (c.status === 'rejeitado') monthly[month].rejected++;
    });

    return Object.entries(monthly).map(([month, stats]) => ({ month, ...(stats as any) }));
  }

  // ── Risk distribution ─────────────────────────────────────────────────────

  async getRiskDistribution(managerId?: string) {
    let clientIds: string[] | null = null;
    if (managerId) {
      clientIds = await this.getClientIdsForManager(managerId);
      if (clientIds.length === 0)
        return [
          { level: 'baixo', count: 0, label: 'Baixo Risco' },
          { level: 'medio', count: 0, label: 'Médio Risco' },
          { level: 'alto',  count: 0, label: 'Alto Risco'  },
        ];
    }

    let query = this.supabase
      .from('credit_scores')
      .select('risk_level, total_score, client_id')
      .order('calculated_at', { ascending: false });

    if (clientIds) query = query.in('client_id', clientIds);

    const { data, error } = await query;
    if (error) return [];

    const distribution: any = { baixo: 0, medio: 0, alto: 0 };
    data.forEach((s: any) => {
      if (distribution[s.risk_level] !== undefined) distribution[s.risk_level]++;
    });

    return Object.entries(distribution).map(([level, count]) => ({
      level,
      count,
      label: level === 'baixo' ? 'Baixo Risco' : level === 'medio' ? 'Médio Risco' : 'Alto Risco',
    }));
  }

  // ── Analyst performance ───────────────────────────────────────────────────
  // Para gestor: mostra desempenho dos analistas nos pedidos dos seus clientes

  async getAnalystPerformance(managerId?: string) {
    let clientIds: string[] | null = null;
    if (managerId) {
      clientIds = await this.getClientIdsForManager(managerId);
      if (clientIds.length === 0) return [];
    }

    let query = this.supabase
      .from('credit_requests')
      .select('analyst_id, status, client_id')
      .not('analyst_id', 'is', null);

    if (clientIds) query = query.in('client_id', clientIds);

    const { data, error } = await query;
    if (error) return [];

    const byAnalyst: any = {};
    data.forEach((c: any) => {
      if (!byAnalyst[c.analyst_id]) byAnalyst[c.analyst_id] = { total: 0, approved: 0, rejected: 0 };
      byAnalyst[c.analyst_id].total++;
      if (c.status === 'aprovado')  byAnalyst[c.analyst_id].approved++;
      if (c.status === 'rejeitado') byAnalyst[c.analyst_id].rejected++;
    });

    return Object.entries(byAnalyst).map(([analyst_id, stats]: any) => ({
      analyst_id,
      ...stats,
      approval_rate: stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0,
    }));
  }
}
