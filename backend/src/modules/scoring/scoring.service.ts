import { Injectable } from '@nestjs/common';
import { ScoringRepository } from './scoring.repository';

// ── Public interfaces ─────────────────────────────────────────────────────────

export interface ScoringResult {
  client_id: string;
  total_score: number;
  /** Capacidade Financeira — peso 25% */
  financial_score: number;
  /** Comportamento Bancário + Estabilidade — peso 20% */
  behavioral_score: number;
  /** Documental — fixo 80 até integração doc-module */
  document_score: number;
  /** Historial de Pagamentos — peso 35% */
  credit_history_score: number;
  risk_level: 'baixo' | 'medio' | 'alto';
  details: ScoringDetails;
}

export interface ScoringDetails {
  // Cinco componentes do scorecard v2
  payment_history_score:    number;
  financial_capacity_score: number;
  debt_burden_score:        number;
  banking_behavior_score:   number;
  stability_score:          number;
  // Hard stops disparados (vazio = nenhum)
  hard_stops: string[];
  // Métricas-chave para o relatório
  avg_net_income_12m:       number;
  rdi:                      number;
  payment_on_time_rate:     number;
  has_active_default:       boolean;
  total_installments_due:   number;
  installments_on_time:     number;
  completed_credits:        number;
  avg_monthly_balance:      number;
  employment_type:          string;
  employment_tenure_years:  number;
  // Campos legacy para compatibilidade com credit_analysis
  has_defaults:       boolean;
  default_count:      number;
  previous_credits:   number;
  completed_credits_count: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ScoringService {
  constructor(private readonly scoringRepository: ScoringRepository) {}

  // ── Entry point ───────────────────────────────────────────

  async calculateScore(client: any): Promise<ScoringResult> {
    // 1. Carregar todos os dados históricos em paralelo
    const [incomeRecords, transactions, installments, externalDebts, bankAccounts, employment] =
      await Promise.all([
        this.scoringRepository.getIncomeRecords(client.id, 12),
        this.scoringRepository.getTransactions(client.id, 12),
        this.scoringRepository.getLoanInstallments(client.id),
        this.scoringRepository.getExternalDebts(client.id),
        this.scoringRepository.getBankAccounts(client.id),
        this.scoringRepository.getEmploymentData(client.id),
      ]);

    // 2. Rendimento verificado = employment_data.monthly_income do emprego corrente
    //    (confirmado pelo gestor ao aprovar o pedido de actualização de conta)
    const currentEmployment = employment.find((e: any) => e.is_current) ?? employment[0];
    const verifiedIncome = currentEmployment?.monthly_income
      ? Number(currentEmployment.monthly_income)
      : null;

    // 3. Calcular rendimento médio líquido (base partilhada por vários componentes)
    const avgNetIncome = this.calcAvgNetIncome(incomeRecords, client, verifiedIncome);

    // 4. Hard stops — verificar antes de qualquer cálculo
    const hardStops = this.checkHardStops(installments, externalDebts, transactions, avgNetIncome);

    // 5. Calcular os 5 componentes
    const paymentResult   = this.calcPaymentHistoryScore(installments);
    const financialResult = this.calcFinancialCapacityScore(incomeRecords, transactions, client, verifiedIncome);
    const debtResult      = this.calcDebtBurdenScore(externalDebts, installments, avgNetIncome);
    const bankingResult   = this.calcBankingBehaviorScore(transactions, bankAccounts);
    const stabilityResult = this.calcStabilityScore(employment, bankAccounts);

    // 5. Score bruto ponderado (35 / 25 / 20 / 15 / 5)
    const rawScore =
      paymentResult.score   * 0.35 +
      financialResult.score * 0.25 +
      debtResult.score      * 0.20 +
      bankingResult.score   * 0.15 +
      stabilityResult.score * 0.05;

    // 6. Se hard stop activo, forçar score abaixo de 25
    const totalScore = hardStops.length > 0
      ? Math.min(rawScore, 24)
      : rawScore;

    const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));
    const riskLevel  = this.classifyRisk(finalScore, hardStops);

    // 7. Mapear para campos legados que credit_scores e credit_analysis esperam
    const result: ScoringResult = {
      client_id:            client.id,
      total_score:          finalScore,
      financial_score:      financialResult.score,          // 25% — Capacidade Financeira
      behavioral_score:     Math.round(
        bankingResult.score * 0.75 + stabilityResult.score * 0.25  // 20% combined
      ),
      document_score:       80,                              // placeholder até integração documental
      credit_history_score: paymentResult.score,            // 35% — Historial Pagamentos
      risk_level:           riskLevel,
      details: {
        payment_history_score:    paymentResult.score,
        financial_capacity_score: financialResult.score,
        debt_burden_score:        debtResult.score,
        banking_behavior_score:   bankingResult.score,
        stability_score:          stabilityResult.score,
        hard_stops:               hardStops,
        avg_net_income_12m:       avgNetIncome,
        rdi:                      debtResult.rdi,
        payment_on_time_rate:     paymentResult.onTimeRate,
        has_active_default:       paymentResult.hasActiveDefault,
        total_installments_due:   paymentResult.totalDue,
        installments_on_time:     paymentResult.onTime,
        completed_credits:        paymentResult.completedCredits,
        avg_monthly_balance:      financialResult.avgBalance,
        employment_type:          stabilityResult.employmentType,
        employment_tenure_years:  stabilityResult.tenureYears,
        // legacy
        has_defaults:         paymentResult.hasActiveDefault,
        default_count:        paymentResult.defaultCount,
        previous_credits:     paymentResult.totalCredits,
        completed_credits_count: paymentResult.completedCredits,
      },
    };

    await this.scoringRepository.saveScore(result);
    return result;
  }

  // ── Hard Stops ────────────────────────────────────────────

  private checkHardStops(
    installments: any[],
    externalDebts: any[],
    transactions: any[],
    avgNetIncome: number,
  ): string[] {
    const triggered: string[] = [];

    // HS-1: Incumprimento activo com >90 dias
    const hasActiveDefault = installments.some(
      i => i.status === 'incumprimento' && (i.days_late ?? 0) > 90,
    );
    if (hasActiveDefault) triggered.push('incumprimento_activo_90d');

    // HS-2: RDI total > 100%
    // Quando rendimento = 0 e existem obrigações, RDI é efectivamente infinito
    const hasAnyActiveObligation =
      installments.some(i => i.status === 'pendente' || i.status === 'em_atraso') ||
      externalDebts.some(d => d.status === 'activo');

    if (avgNetIncome <= 0 && hasAnyActiveObligation) {
      triggered.push('rdi_acima_100pct');
    } else if (avgNetIncome > 0) {
      const activeLoansMap = new Map<string, number>();
      installments
        .filter(i => i.status === 'pendente' || i.status === 'em_atraso')
        .forEach(i => {
          if (!activeLoansMap.has(i.credit_request_id)) {
            activeLoansMap.set(i.credit_request_id, i.amount ?? 0);
          }
        });
      const loanObligation = [...activeLoansMap.values()].reduce((s, v) => s + v, 0);
      const externalObligation = externalDebts
        .filter(d => d.status === 'activo')
        .reduce((s, d) => s + (d.monthly_payment ?? 0), 0);
      const rdi = (loanObligation + externalObligation) / avgNetIncome;
      if (rdi > 1.0) triggered.push('rdi_acima_100pct');
    }

    // HS-3: 2+ cheques devolvidos nos últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const bouncedRecent = transactions.filter(t => {
      const desc = (t.description ?? '').toLowerCase();
      const isRecent = new Date(t.transaction_date) >= sixMonthsAgo;
      return isRecent && (
        desc.includes('cheque devol') ||
        desc.includes('devolução cheque') ||
        desc.includes('chq dev')
      );
    }).length;
    if (bouncedRecent >= 2) triggered.push('cheques_devolvidos_recentes');

    return triggered;
  }

  // ── Componente 1: Historial de Pagamentos (35%) ───────────

  private calcPaymentHistoryScore(installments: any[]): {
    score: number; onTimeRate: number; hasActiveDefault: boolean;
    totalDue: number; onTime: number; defaultCount: number;
    totalCredits: number; completedCredits: number;
  } {
    const due = installments.filter(i => i.status !== 'pendente');

    if (due.length === 0) {
      // Sem histórico: score neutro de 60
      return {
        score: 60, onTimeRate: 1, hasActiveDefault: false,
        totalDue: 0, onTime: 0, defaultCount: 0,
        totalCredits: 0, completedCredits: 0,
      };
    }

    const total       = due.length;
    const onTime      = due.filter(i => i.status === 'pago' && (i.days_late ?? 0) === 0).length;
    const late1to29   = due.filter(i => (i.days_late ?? 0) >= 1 && (i.days_late ?? 0) < 30).length;
    const late30to89  = due.filter(i => (i.days_late ?? 0) >= 30 && (i.days_late ?? 0) < 90).length;
    const over90      = due.filter(i => i.status === 'incumprimento' || (i.days_late ?? 0) >= 90).length;
    const partial     = due.filter(i => i.status === 'pago_parcial').length;

    // Score baseado em rácios ponderados
    const rawScore =
      (onTime    / total) * 100 +
      (late1to29 / total) * 70  +
      (late30to89 / total) * 25 +
      (partial   / total) * 40  +
      (over90    / total) * 0;

    // Cap severo se há incumprimento activo
    const hasActiveDefault = installments.some(i => i.status === 'incumprimento');
    const cappedScore = hasActiveDefault ? Math.min(rawScore, 15) : rawScore;

    // Bónus por créditos completamente liquidados
    const byRequest = new Map<string, any[]>();
    installments.forEach(i => {
      const arr = byRequest.get(i.credit_request_id) ?? [];
      arr.push(i);
      byRequest.set(i.credit_request_id, arr);
    });
    let completedCredits = 0;
    byRequest.forEach(insts => {
      if (insts.length > 0 && insts.every(i => i.status === 'pago')) completedCredits++;
    });

    const finalScore = Math.min(100, cappedScore + completedCredits * 5);

    return {
      score:            Math.max(0, Math.round(finalScore)),
      onTimeRate:       Math.round((onTime / total) * 100) / 100,
      hasActiveDefault,
      totalDue:         total,
      onTime,
      defaultCount:     over90,
      totalCredits:     byRequest.size,
      completedCredits,
    };
  }

  // ── Componente 2: Capacidade Financeira (25%) ─────────────

  private calcFinancialCapacityScore(
    incomeRecords: any[],
    transactions: any[],
    client: any,
    verifiedIncome: number | null = null,
  ): { score: number; avgIncome: number; avgBalance: number; cv: number } {
    // Rendimento médio líquido — prioridade: verificado > histórico > perfil
    const netIncomes = incomeRecords.map(r => r.net_income ?? r.gross_income ?? 0).filter(v => v > 0);
    const historicalAvg = netIncomes.length > 0
      ? netIncomes.reduce((s, v) => s + v, 0) / netIncomes.length
      : null;

    // Se rendimento verificado por documento aprovado existe, usar como âncora
    const avgIncome = verifiedIncome
      ? verifiedIncome
      : (historicalAvg ?? (client.monthly_income ?? 0) * 0.9);

    // Nível de rendimento (40%)
    let incomeLevel: number;
    if      (avgIncome >= 900000) incomeLevel = 100;
    else if (avgIncome >= 600000) incomeLevel = 85;
    else if (avgIncome >= 450000) incomeLevel = 70;
    else if (avgIncome >= 300000) incomeLevel = 55;
    else if (avgIncome >= 200000) incomeLevel = 40;
    else if (avgIncome >= 100000) incomeLevel = 25;
    else if (avgIncome >= 50000)  incomeLevel = 10;
    else                          incomeLevel = 0;

    // Estabilidade do rendimento via coeficiente de variação (35%)
    let cv = 0;
    let stabilityScore = 60; // neutro se sem dados
    if (netIncomes.length >= 3) {
      const mean = avgIncome;
      const variance = netIncomes.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / netIncomes.length;
      cv = mean > 0 ? Math.sqrt(variance) / mean : 1;

      if      (cv < 0.05) stabilityScore = 100;
      else if (cv < 0.15) stabilityScore = 80;
      else if (cv < 0.30) stabilityScore = 60;
      else if (cv < 0.50) stabilityScore = 40;
      else                stabilityScore = 20;
    }

    // Rácio saldo médio / rendimento (25%)
    const avgBalance = transactions.length > 0
      ? transactions.reduce((s, t) => s + (t.balance_after ?? 0), 0) / transactions.length
      : (client.account_balance ?? 0);
    const balanceRatio = avgIncome > 0
      ? Math.min(100, (avgBalance / avgIncome) * 33)
      : 0;

    // Bónus se o rendimento foi verificado por documento aprovado (+5 pontos de confiança)
    const verificationBonus = verifiedIncome ? 5 : 0;
    const score = incomeLevel * 0.40 + stabilityScore * 0.35 + balanceRatio * 0.25 + verificationBonus;

    return {
      score:      Math.max(0, Math.min(100, Math.round(score))),
      avgIncome,
      avgBalance: Math.round(avgBalance),
      cv:         Math.round(cv * 100) / 100,
    };
  }

  // ── Componente 3: Carga de Endividamento — RDI Real (20%) ─

  private calcDebtBurdenScore(
    externalDebts: any[],
    installments: any[],
    avgNetIncome: number,
  ): { score: number; rdi: number; totalObligations: number } {
    if (avgNetIncome <= 0) {
      return { score: 0, rdi: 1, totalObligations: 0 };
    }

    // Dívidas externas activas
    const externalObligation = externalDebts
      .filter(d => d.status === 'activo')
      .reduce((s, d) => s + (d.monthly_payment ?? 0), 0);

    // Prestações de créditos activos no banco (uma por crédito)
    const activeLoansMap = new Map<string, number>();
    installments
      .filter(i => i.status === 'pendente' || i.status === 'em_atraso')
      .forEach(i => {
        if (!activeLoansMap.has(i.credit_request_id)) {
          activeLoansMap.set(i.credit_request_id, i.amount ?? 0);
        }
      });
    const loanObligation = [...activeLoansMap.values()].reduce((s, v) => s + v, 0);

    const totalObligations = externalObligation + loanObligation;
    const rdi = totalObligations / avgNetIncome;

    let score: number;
    if      (rdi === 0)    score = 100;
    else if (rdi <= 0.15)  score = 90;
    else if (rdi <= 0.25)  score = 75;
    else if (rdi <= 0.35)  score = 55;
    else if (rdi <= 0.45)  score = 35;
    else if (rdi <= 0.60)  score = 15;
    else if (rdi <= 0.80)  score = 5;
    else                   score = 0;

    return {
      score,
      rdi:              Math.round(rdi * 1000) / 1000,
      totalObligations: Math.round(totalObligations),
    };
  }

  // ── Componente 4: Comportamento Bancário (15%) ────────────

  private calcBankingBehaviorScore(
    transactions: any[],
    accounts: any[],
  ): { score: number } {
    // Frequência mensal de transacções (50%)
    const avgMonthlyTxn = transactions.length / 12;
    const freqScore = Math.min(100, avgMonthlyTxn * 5);

    // Antiguidade da conta mais antiga (50%)
    let ageScore: number;
    if (accounts.length === 0) {
      ageScore = 60; // score neutro quando não há dados
    } else {
      const oldestDate = accounts
        .map(a => new Date(a.opened_at).getTime())
        .reduce((oldest, d) => (d < oldest ? d : oldest), Infinity);
      const ageMonths = Math.floor((Date.now() - oldestDate) / (30.44 * 24 * 60 * 60 * 1000));
      if      (ageMonths >= 36) ageScore = 100;
      else if (ageMonths >= 24) ageScore = 80;
      else if (ageMonths >= 12) ageScore = 60;
      else if (ageMonths >= 6)  ageScore = 40;
      else                      ageScore = 20;
    }

    // Penalizações
    const bouncedCount = transactions.filter(t => {
      const d = (t.description ?? '').toLowerCase();
      return d.includes('devolu') && (d.includes('cheque') || d.includes('chq'));
    }).length;
    const hadNegativeBalance = transactions.some(t => (t.balance_after ?? 0) < 0);

    const rawScore = freqScore * 0.50 + ageScore * 0.50;
    const penalties = bouncedCount * 15 + (hadNegativeBalance ? 20 : 0);

    return { score: Math.max(0, Math.min(100, Math.round(rawScore - penalties))) };
  }

  // ── Componente 5: Estabilidade & Vínculo Laboral (5%) ─────

  private calcStabilityScore(
    employment: any[],
    accounts: any[],
  ): { score: number; employmentType: string; tenureYears: number } {
    const current = employment.find(e => e.is_current) ?? employment[0];

    if (!current) {
      return { score: 20, employmentType: 'desconhecido', tenureYears: 0 };
    }

    // Tipo de vínculo (45%)
    const typeMap: Record<string, number> = {
      efectivo:   100,
      contrato:   70,
      freelancer: 50,
      outro:      30,
    };
    const typeScore = typeMap[current.employment_type] ?? 20;

    // Antiguidade no emprego (35%)
    const tenureYears = current.start_date
      ? (Date.now() - new Date(current.start_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      : 0;

    let tenureScore: number;
    if      (tenureYears >= 5) tenureScore = 100;
    else if (tenureYears >= 3) tenureScore = 80;
    else if (tenureYears >= 2) tenureScore = 60;
    else if (tenureYears >= 1) tenureScore = 40;
    else                       tenureScore = 20;

    // Relacionamento bancário — meses da conta mais antiga (20%)
    const oldestDate = accounts
      .map(a => new Date(a.opened_at).getTime())
      .reduce((oldest, d) => (d < oldest ? d : oldest), Date.now());
    const bankAgeMonths = Math.floor((Date.now() - oldestDate) / (30.44 * 24 * 60 * 60 * 1000));
    const bankRelScore  = Math.min(100, bankAgeMonths * 2.5);

    const score = typeScore * 0.45 + tenureScore * 0.35 + bankRelScore * 0.20;

    return {
      score:          Math.max(0, Math.min(100, Math.round(score))),
      employmentType: current.employment_type ?? 'desconhecido',
      tenureYears:    Math.round(tenureYears * 10) / 10,
    };
  }

  // ── Helpers ───────────────────────────────────────────────

  private calcAvgNetIncome(
    incomeRecords: any[],
    client: any,
    verifiedIncome: number | null = null,
  ): number {
    if (verifiedIncome && verifiedIncome > 0) return verifiedIncome;

    const nets = incomeRecords
      .map(r => r.net_income ?? r.gross_income ?? 0)
      .filter(v => v > 0);

    return nets.length > 0
      ? nets.reduce((s, v) => s + v, 0) / nets.length
      : (client.monthly_income ?? 0) * 0.9;
  }

  private classifyRisk(score: number, hardStops: string[]): 'baixo' | 'medio' | 'alto' {
    if (hardStops.length > 0 || score < 35) return 'alto';
    if (score >= 65)                        return 'baixo';
    return 'medio';
  }
}
