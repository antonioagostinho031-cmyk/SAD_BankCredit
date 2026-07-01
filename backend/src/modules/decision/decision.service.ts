import { Injectable } from '@nestjs/common';
import { DecisionRepository } from './decision.repository';
import { AiService } from './services/ai.service';
import { ScoringResult, ScoringDetails } from '../scoring/scoring.service';
import { RiskAssessment } from '../risk/risk.service';

export interface DecisionResult {
  recommendation: 'aprovado' | 'aprovado_condicional' | 'revisao' | 'rejeitado';
  confidence: number;
  justification: string;
  conditions?: string[];
  improvement_suggestions?: string[];
  max_approved_amount?: number;
  suggested_term?: number;
  hard_stops_triggered?: string[];
}

interface RuleOutput {
  type: DecisionResult['recommendation'];
  confidence: number;
  conditions?: string[];
  improvement_suggestions?: string[];
}

@Injectable()
export class DecisionService {
  constructor(
    private decisionRepository: DecisionRepository,
    private aiService: AiService,
  ) {}

  async generateDecision(
    scoring: ScoringResult,
    risk: RiskAssessment,
    client: any,
    creditRequest: any,
  ): Promise<DecisionResult> {
    const rule = this.applyDecisionRules(scoring, risk, creditRequest);

    const aiContext = {
      client,
      credit: creditRequest,
      scoring,
      risk,
      recommendation: rule.type,
      hard_stops: scoring.details?.hard_stops ?? [],
    };
    const justification = await this.aiService.generateCreditJustification(aiContext);

    const decision: DecisionResult = {
      recommendation:          rule.type,
      confidence:              rule.confidence,
      justification,
      conditions:              rule.conditions,
      improvement_suggestions: rule.improvement_suggestions,
      max_approved_amount:     risk.max_recommended_amount,
      suggested_term:          creditRequest.term_months,
      hard_stops_triggered:    scoring.details?.hard_stops ?? [],
    };

    await this.decisionRepository.saveDecision({
      credit_request_id: creditRequest.id,
      client_id:         client.id,
      recommendation:    decision.recommendation,
      confidence:        decision.confidence,
      justification:     decision.justification,
      scoring_data:      scoring,
      risk_data:         risk,
      decided_at:        new Date().toISOString(),
    });

    return decision;
  }

  // ── Decision rules — scorecard v2 thresholds ─────────────

  private applyDecisionRules(
    scoring: ScoringResult,
    risk: RiskAssessment,
    creditRequest: any,
  ): RuleOutput {
    const score         = scoring.total_score;
    const debtRatioPct  = risk.debt_ratio;
    const requested     = creditRequest.requested_amount ?? 0;
    const maxRecommended = risk.max_recommended_amount ?? 0;
    const hardStops     = scoring.details?.hard_stops ?? [];
    const highFactors   = risk.risk_factors.filter(f => f.severity === 'alto').length;
    const hasActiveDefault = scoring.details?.has_active_default ?? false;

    // ── Hard Stops: rejeição automática imediata ──────────
    if (hardStops.length > 0) {
      return {
        type: 'rejeitado',
        confidence: 93,
        improvement_suggestions: this.buildImprovementSuggestions(scoring, risk, score),
      };
    }

    // ── Score < 35: rejeição por scorecard ────────────────
    if (score < 35) {
      return {
        type: 'rejeitado',
        confidence: 93,
        improvement_suggestions: this.buildImprovementSuggestions(scoring, risk, score),
      };
    }

    // ── Score 35–49: revisão manual ───────────────────────
    if (score < 50) {
      return {
        type: 'revisao',
        confidence: 55,
        conditions: [
          'Análise manual obrigatória pelo departamento de crédito',
          'Requerer documentação adicional de suporte ao rendimento',
        ],
        improvement_suggestions: this.buildImprovementSuggestions(scoring, risk, score),
      };
    }

    // ── Score 50–64: aprovação condicional ────────────────
    if (score < 65) {
      const conditions: string[] = [];

      if (requested > maxRecommended && maxRecommended > 0) {
        conditions.push(
          `Montante ajustado ao máximo recomendado: ${Math.round(maxRecommended).toLocaleString('pt-AO')} AOA`,
        );
      }
      if (debtRatioPct > 35) {
        conditions.push(`RDI pós-concessão de ${debtRatioPct.toFixed(1)}% — apresentar garantias adicionais`);
      }
      if (highFactors >= 1) {
        conditions.push('Sujeito a aprovação pelo comité de crédito');
      }

      if (conditions.length === 0) {
        conditions.push('Sujeito a revisão pelo analista de crédito');
      }
      return { type: 'aprovado_condicional', confidence: 65, conditions };
    }

    // ── Score 65–74: aprovação normal ─────────────────────
    if (score < 75) {
      const conditions: string[] = [];

      if (requested > maxRecommended && maxRecommended > 0) {
        conditions.push(
          `Montante ajustado ao máximo recomendado: ${Math.round(maxRecommended).toLocaleString('pt-AO')} AOA`,
        );
      }
      if (debtRatioPct > 45) {
        conditions.push('Validação de encargos mensais actualizada exigida');
      }

      return conditions.length > 0
        ? { type: 'aprovado_condicional', confidence: 75, conditions }
        : { type: 'aprovado', confidence: 80 };
    }

    // ── Score ≥ 75: aprovação automática ──────────────────
    if (requested <= maxRecommended || maxRecommended <= 0) {
      return { type: 'aprovado', confidence: 90 };
    }

    // Montante superior ao recomendado — condicionar ao tecto
    return {
      type: 'aprovado_condicional',
      confidence: 82,
      conditions: [
        `Montante aprovado limitado ao máximo recomendado: ${Math.round(maxRecommended).toLocaleString('pt-AO')} AOA`,
      ],
    };
  }

  // ── Improvement suggestions for rejections / reviews ─────

  private buildImprovementSuggestions(
    scoring: ScoringResult,
    risk: RiskAssessment,
    score: number,
  ): string[] {
    const suggestions: string[] = [];
    const d: Partial<ScoringDetails> = scoring.details ?? {};

    if (d.has_active_default || (d.default_count ?? 0) > 0) {
      suggestions.push('Regularizar todos os incumprimentos e prestações em atraso antes de nova candidatura');
    }

    if ((d.payment_on_time_rate ?? 1) < 0.80) {
      suggestions.push('Melhorar pontualidade de pagamentos — manter taxa acima de 80% durante pelo menos 6 meses');
    }

    if ((d.rdi ?? 0) > 0.50) {
      suggestions.push('Reduzir encargos mensais existentes (liquidar dívidas externas ou prestações activas)');
    }

    if ((d.financial_capacity_score ?? 100) < 50) {
      suggestions.push('Candidatar-se com rendimento comprovado mais elevado ou aguardar progressão salarial');
    }

    if ((d.stability_score ?? 100) < 50) {
      suggestions.push('Consolidar vínculo laboral efectivo e aumentar antiguidade na instituição (mínimo 1 ano)');
    }

    if ((d.banking_behavior_score ?? 100) < 50) {
      suggestions.push('Aumentar movimentações regulares na conta e evitar saldos negativos');
    }

    if (score < 35 && suggestions.length === 0) {
      suggestions.push('Score insuficiente — reavaliar após 12 meses de historial bancário positivo');
    }

    return suggestions;
  }
}
