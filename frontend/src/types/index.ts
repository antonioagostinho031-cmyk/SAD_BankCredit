export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'analista' | 'gestor' | 'supervisor' | 'cliente'
  active: boolean
  created_at: string
}

export interface Client {
  id: string
  user_id: string
  full_name: string
  bi_number: string
  nif: string
  date_of_birth: string
  marital_status: string
  address: string
  phone: string
  email: string
  employer: string
  job_title: string
  employment_type: string
  monthly_income: number
  account_number: string
  account_balance: number
  registration_status: string
  is_eligible_for_credit: boolean
  account_manager_id: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  client_id: string
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  status: string
  expiry_date: string
  confidence_score: number
  validation_notes: string
  validated_by: string
  validated_at: string
  uploaded_at: string
  created_at: string
}

export interface CreditRequest {
  id: string
  client_id: string
  clients?: Client
  requested_amount: number
  approved_amount: number
  term_months: number
  interest_rate: number
  monthly_payment: number
  purpose: string
  purpose_description: string
  status: string
  analyst_id: string
  manager_id: string
  conditions: string
  rejection_reason: string
  submission_date: string
  analysis_start_date: string
  decision_date: string
  created_at: string
  updated_at: string
}

export interface CreditAnalysis {
  id: string
  credit_request_id: string
  analyst_id: string
  financial_capacity: number
  debt_ratio: number
  income_stability: number
  credit_history_score: number
  document_quality_score: number
  overall_score: number
  recommendation: string
  analyst_notes: string
  analysis_date: string
}

export interface CreditScore {
  id: string
  client_id: string
  total_score: number
  financial_score: number
  behavioral_score: number
  document_score: number
  credit_history_score: number
  risk_level: 'baixo' | 'medio' | 'alto'
  details: any
  calculated_at: string
}

export interface RiskAssessment {
  id: string
  client_id: string
  credit_request_id: string
  risk_level: 'baixo' | 'medio' | 'alto' | 'muito_alto'
  risk_score: number
  debt_ratio: number
  payment_capacity: number
  max_recommended_amount: number
  risk_factors: RiskFactor[]
  mitigating_factors: string[]
  assessed_at: string
}

export interface RiskFactor {
  factor: string
  severity: 'baixo' | 'medio' | 'alto'
  description: string
}

export interface DecisionLog {
  id: string
  credit_request_id: string
  client_id: string
  recommendation: 'aprovado' | 'aprovado_condicional' | 'revisao' | 'rejeitado'
  confidence: number
  justification: string
  scoring_data: CreditScore
  risk_data: RiskAssessment
  decided_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  entity_id: string
  read: boolean
  read_at: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  details: any
  ip_address: string
  created_at: string
}

export interface AuthResponse {
  user: User
  access_token: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}
