import { Injectable } from '@nestjs/common';
import { RiskRepository } from './risk.repository';
import { ScoringRepository } from '../scoring/scoring.repository';
import { ScoringResult } from '../scoring/scoring.service';

export interface RiskAssessment {
  client_id: string;
  credit_request_id: string;
  risk_level: 'baixo' | 'medio' | 'alto' | 'muito_alto';
  risk_score: number;
  debt_ratio: number;
  payment_capacity: number;
  max_recommended_amount: number;
  risk_factors: RiskFactor[];
  mitigating_factors: string[];
}

export interface RiskFactor {
  factor: string;
  severity: 'baixo' | 'medio' | 'alto';
  description: string;
}

@Injectable()
export class RiskService {
  constructor(
    private riskRepository: RiskRepository,
    private scoringRepository: ScoringRepository,
  ) {}

  async assessRisk(
    client: any,
    creditRequest: any,
    scoringResult: ScoringResult,
  ): Promise<RiskAssessment> {
    const requestedAmount = creditRequest.requested_amount || 0;
    const termMonths      = creditRequest.term_months || 12;

    // Rendimento médio real da avaliação de scoring (ou fallback ao campo clients)
    const avgNetIncome =
      (scoringResult.details?.avg_net_income_12m ?? 0) > 0
        ? scoringResult.details.avg_net_income_12m
        : (client.monthly_income ?? 0) * 0.9;

    // Taxa de juro e prestação estimada para este pedido
    const annualRate   = this.getInterestRate(termMonths);
    const monthlyRate  = annualRate / 100 / 12;
    const newMonthlyPayment =
      (requestedAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);

    // RDI real: obrigações existentes + nova prestação, em percentagem do rendimento líquido
    const existingRDI = scoringResult.details?.rdi ?? 0;
    const existingObligations = existingRDI * avgNetIncome;
    const totalObligations    = existingObligations + newMonthlyPayment;
    const debt_ratio = avgNetIncome > 0 ? (totalObligations / avgNetIncome) * 100 : 100;

    // Capacidade de pagamento livre (35% do rendimento líquido - obrigações existentes)
    const payment_capacity = Math.max(0, avgNetIncome * 0.35 - existingObligations);

    // Montante máximo que a capacidade livre suporta
    const max_recommended_amount = payment_capacity > 0 && monthlyRate > 0
      ? (payment_capacity * (Math.pow(1 + monthlyRate, termMonths) - 1)) /
        (monthlyRate * Math.pow(1 + monthlyRate, termMonths))
      : payment_capacity * termMonths;

    const risk_factors     = this.identifyRiskFactors(client, creditRequest, scoringResult, debt_ratio, avgNetIncome, newMonthlyPayment);
    const mitigating_factors = this.identifyMitigatingFactors(client, scoringResult, avgNetIncome);
    const risk_level       = this.determineRiskLevel(scoringResult.total_score, debt_ratio, risk_factors, scoringResult.details);

    const assessment: RiskAssessment = {
      client_id:               client.id,
      credit_request_id:       creditRequest.id,
      risk_level,
      risk_score:              100 - scoringResult.total_score,
      debt_ratio:              Math.round(debt_ratio * 100) / 100,
      payment_capacity:        Math.round(payment_capacity * 100) / 100,
      max_recommended_amount:  Math.round(Math.max(0, max_recommended_amount) * 100) / 100,
      risk_factors,
      mitigating_factors,
    };

    await this.riskRepository.saveAssessment(assessment);
    return assessment;
  }

  // ── Risk factor identification ────────────────────────────

  private identifyRiskFactors(
    client: any,
    creditRequest: any,
    scoring: ScoringResult,
    debtRatioPct: number,
    avgNetIncome: number,
    newMonthlyPayment: number,
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Hard stops disparados pelo scoring engine
    const hardStops = scoring.details?.hard_stops ?? [];
    if (hardStops.includes('incumprimento_activo_90d')) {
      factors.push({
        factor: 'active_default_90d',
        severity: 'alto',
        description: 'Incumprimento activo com mais de 90 dias registado no banco',
      });
    }
    if (hardStops.includes('rdi_acima_100pct')) {
      factors.push({
        factor: 'rdi_over_100pct',
        severity: 'alto',
        description: 'Rácio de endividamento total superior a 100% do rendimento líquido',
      });
    }
    if (hardStops.includes('cheques_devolvidos_recentes')) {
      factors.push({
        factor: 'bounced_cheques',
        severity: 'alto',
        description: '2 ou mais cheques devolvidos nos últimos 6 meses',
      });
    }

    // RDI com o novo pedido
    if (debtRatioPct > 60) {
      factors.push({
        factor: 'debt_ratio_critical',
        severity: 'alto',
        description: `RDI pós-concessão de ${debtRatioPct.toFixed(1)}% excede criticamente o limite de 50%`,
      });
    } else if (debtRatioPct > 45) {
      factors.push({
        factor: 'debt_ratio_high',
        severity: 'alto',
        description: `RDI pós-concessão de ${debtRatioPct.toFixed(1)}% supera o limite recomendado de 35%`,
      });
    } else if (debtRatioPct > 35) {
      factors.push({
        factor: 'debt_ratio_moderate',
        severity: 'medio',
        description: `RDI pós-concessão de ${debtRatioPct.toFixed(1)}% próxima do limite de 35%`,
      });
    }

    // Historial de pagamentos fraco
    if (scoring.details?.has_active_default) {
      factors.push({
        factor: 'payment_default',
        severity: 'alto',
        description: `Registo de ${scoring.details.default_count ?? 0} incumprimento(s) activo(s)`,
      });
    } else if ((scoring.details?.default_count ?? 0) > 0) {
      factors.push({
        factor: 'previous_defaults',
        severity: 'medio',
        description: `Incumprimentos anteriores já regularizados (${scoring.details.default_count})`,
      });
    }

    // Rendimento baixo
    if (avgNetIncome < 100000) {
      factors.push({
        factor: 'low_income',
        severity: avgNetIncome < 50000 ? 'alto' : 'medio',
        description: `Rendimento líquido médio de ${Math.round(avgNetIncome).toLocaleString('pt-AO')} AOA/mês está abaixo do mínimo recomendado`,
      });
    }

    // Sem vínculo laboral registado
    const empType = scoring.details?.employment_type ?? 'desconhecido';
    if (empType === 'desconhecido' || !client.employer) {
      factors.push({
        factor: 'no_employment',
        severity: 'alto',
        description: 'Sem vínculo laboral comprovado',
      });
    } else if (empType === 'freelancer' || empType === 'outro') {
      factors.push({
        factor: 'unstable_employment',
        severity: 'medio',
        description: `Vínculo laboral com menor estabilidade (${empType})`,
      });
    }

    // Score de capacidade financeira baixo
    if ((scoring.details?.financial_capacity_score ?? 100) < 40) {
      factors.push({
        factor: 'low_financial_capacity',
        severity: 'medio',
        description: 'Capacidade financeira calculada abaixo do limiar de conforto',
      });
    }

    return factors;
  }

  private identifyMitigatingFactors(
    client: any,
    scoring: ScoringResult,
    avgNetIncome: number,
  ): string[] {
    const factors: string[] = [];

    if (avgNetIncome >= 500000) {
      factors.push(`Rendimento líquido elevado (${Math.round(avgNetIncome / 1000)}K AOA/mês)`);
    }

    const avgBalance = scoring.details?.avg_monthly_balance ?? 0;
    if (avgBalance > avgNetIncome * 2) {
      factors.push('Saldo médio em conta superior a 2× o rendimento mensal');
    }

    const completed = scoring.details?.completed_credits_count ?? scoring.details?.completed_credits ?? 0;
    if (completed > 0) {
      factors.push(`${completed} crédito(s) anterior(es) totalmente liquidado(s) sem incumprimentos`);
    }

    const empType = scoring.details?.employment_type;
    if (empType === 'efectivo') {
      const tenure = scoring.details?.employment_tenure_years ?? 0;
      factors.push(`Vínculo efectivo com ${tenure.toFixed(1)} ano(s) de antiguidade`);
    }

    if ((scoring.details?.payment_on_time_rate ?? 0) >= 0.95) {
      factors.push('Taxa de pontualidade nos pagamentos superior a 95%');
    }

    if ((scoring.details?.debt_burden_score ?? 0) >= 70) {
      factors.push('Carga de endividamento actual controlada');
    }

    return factors;
  }

  // ── Risk level from score + enriched data ─────────────────

  private determineRiskLevel(
    totalScore: number,
    debtRatioPct: number,
    riskFactors: RiskFactor[],
    details: any,
  ): 'baixo' | 'medio' | 'alto' | 'muito_alto' {
    const hardStops  = (details?.hard_stops ?? []).length;
    const highCount  = riskFactors.filter(f => f.severity === 'alto').length;

    if (hardStops > 0 || highCount >= 3 || (debtRatioPct > 70 && totalScore < 35)) {
      return 'muito_alto';
    }
    if (highCount >= 2 || debtRatioPct > 50 || totalScore < 35) {
      return 'alto';
    }
    if (highCount >= 1 || debtRatioPct > 35 || totalScore < 65) {
      return 'medio';
    }
    return 'baixo';
  }

  private getInterestRate(termMonths: number): number {
    if (termMonths <= 12) return 18;
    if (termMonths <= 36) return 20;
    if (termMonths <= 60) return 22;
    return 24;
  }
}
