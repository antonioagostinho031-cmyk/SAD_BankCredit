export enum CreditStatus {
  RASCUNHO = 'rascunho',
  SUBMETIDO = 'submetido',
  EM_ANALISE = 'em_analise',
  APROVADO = 'aprovado',
  APROVADO_CONDICIONAL = 'aprovado_condicional',
  REJEITADO = 'rejeitado',
  CANCELADO = 'cancelado',
  DESEMBOLSADO = 'desembolsado',
}

export enum CreditPurpose {
  PESSOAL = 'pessoal',
  HABITACAO = 'habitacao',
  AUTOMOVEL = 'automovel',
  EDUCACAO = 'educacao',
  SAUDE = 'saude',
  CONSOLIDACAO = 'consolidacao',
  NEGOCIO = 'negocio',
  OUTROS = 'outros',
}

export class CreditRequest {
  id: string;
  client_id: string;
  product_id: string;
  requested_amount: number;
  approved_amount: number;
  term_months: number;
  interest_rate: number;
  monthly_payment: number;
  purpose: CreditPurpose;
  purpose_description: string;
  metadata: Record<string, any>;
  status: CreditStatus;
  submission_date: Date;
  analysis_start_date: Date;
  decision_date: Date;
  analyst_id: string;
  manager_id: string;
  rejection_reason: string;
  conditions: string;
  created_at: Date;
  updated_at: Date;
}

export class CreditAnalysis {
  id: string;
  credit_request_id: string;
  analyst_id: string;
  financial_capacity: number;
  debt_ratio: number;
  income_stability: number;
  credit_history_score: number;
  document_quality_score: number;
  overall_score: number;
  recommendation: string;
  analyst_notes: string;
  analysis_date: Date;
  created_at: Date;
  updated_at: Date;
}
