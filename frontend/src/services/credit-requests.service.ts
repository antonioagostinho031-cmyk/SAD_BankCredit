import api from './api'

export interface PortalCreditRequest {
  id: string
  requestNumber: string
  status: string
  productName: string
  amount: number
  approvedAmount?: number
  term: number
  monthlyPayment: number
  interestRate: number
  submittedAt: string
  analyst?: string
  conditions?: string
  rejectionReason?: string
}

export interface CreditRequestFromAPI {
  id: string
  client_id: string
  requested_amount: number
  approved_amount?: number
  term_months: number
  interest_rate: number
  monthly_payment: number
  purpose: string
  purpose_description?: string
  status: string
  submission_date: string
  analysis_start_date?: string
  decision_date?: string
  analyst_id?: string
  manager_id?: string
  rejection_reason?: string
  conditions?: string
  created_at: string
  updated_at: string
}

export interface PortalCreditRequestDetails extends PortalCreditRequest {
  timeline: Array<{
    stage: string
    date: string | null
    status: 'completed' | 'current' | 'pending'
    description: string
  }>
  analysis?: any
  documents?: Array<{
    name: string
    status: 'pending' | 'approved' | 'rejected'
    uploadedAt: string
    reason?: string
  }>
  messages?: Array<{
    from: string
    message: string
    date: string
  }>
}

export interface CreateCreditRequestDto {
  client_id: string
  requested_amount: number
  term_months: number
  purpose: string
  purpose_description?: string
}

export interface SimulationResult {
  amount: number
  term_months: number
  interest_rate: number
  monthly_payment: number
  total_amount: number
  total_interest: number
  amortization_table: Array<{
    month: number
    payment: number
    principal: number
    interest: number
    balance: number
  }>
}

const purposeToProductName: Record<string, string> = {
  habitacao: 'Crédito Habitação',
  automovel: 'Crédito Automóvel',
  educacao: 'Crédito Educação',
  saude: 'Crédito Saúde',
  consolidacao: 'Crédito Consolidado',
  negocio: 'Crédito Empresarial',
  outros: 'Crédito Pessoal',
  pessoal: 'Crédito Pessoal Atlântico',
}

function transformCreditRequest(apiRequest: CreditRequestFromAPI): PortalCreditRequest {
  return {
    id: apiRequest.id,
    requestNumber: `CR-${new Date(apiRequest.submission_date).getFullYear()}-${apiRequest.id.substring(0, 6).toUpperCase()}`,
    status: apiRequest.status,
    productName: purposeToProductName[apiRequest.purpose] || 'Crédito',
    amount: apiRequest.requested_amount,
    approvedAmount: apiRequest.approved_amount,
    term: apiRequest.term_months,
    monthlyPayment: apiRequest.monthly_payment,
    interestRate: apiRequest.interest_rate,
    submittedAt: apiRequest.submission_date,
    analyst: apiRequest.analyst_id ? 'Analista Responsável' : undefined,
    conditions: apiRequest.conditions,
    rejectionReason: apiRequest.rejection_reason,
  }
}

export const creditRequestsService = {
  async getMyRequests(): Promise<PortalCreditRequest[]> {
    const { data } = await api.get<CreditRequestFromAPI[]>('/credit/my-requests')
    return data.map(transformCreditRequest)
  },

  async getRequestDetails(id: string): Promise<PortalCreditRequestDetails> {
    const { data } = await api.get<PortalCreditRequestDetails>(`/credit/my-requests/${id}/details`)
    return data
  },

  async create(dto: CreateCreditRequestDto): Promise<PortalCreditRequest> {
    const { data } = await api.post<CreditRequestFromAPI>('/credit', dto)
    return transformCreditRequest(data)
  },

  async simulate(amount: number, term_months: number, interest_rate?: number): Promise<SimulationResult> {
    const { data } = await api.post<SimulationResult>('/credit/simulate', {
      amount,
      term_months,
      interest_rate
    })
    return data
  },

  async cancel(id: string, reason: string): Promise<void> {
    await api.patch(`/credit/${id}/cancel`, { reason })
  },

  formatStatus(status: string): { label: string; color: string } {
    const statusMap: Record<string, { label: string; color: string }> = {
      rascunho: { label: 'Rascunho', color: 'bg-gray-400' },
      submetido: { label: 'Submetido', color: 'bg-blue-500' },
      em_analise: { label: 'Em Análise', color: 'bg-yellow-500' },
      documentacao_pendente: { label: 'Documentação Pendente', color: 'bg-orange-500' },
      aprovado: { label: 'Aprovado', color: 'bg-green-500' },
      aprovado_condicional: { label: 'Aprovado Condicional', color: 'bg-teal-500' },
      rejeitado: { label: 'Rejeitado', color: 'bg-red-500' },
      cancelado: { label: 'Cancelado', color: 'bg-gray-500' },
      desembolsado: { label: 'Desembolsado', color: 'bg-green-600' }
    }

    return statusMap[status] || { label: status, color: 'bg-gray-400' }
  }
}
