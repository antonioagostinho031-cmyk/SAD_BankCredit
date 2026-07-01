import api from './api'

export interface CreditProduct {
  id: string
  name: string
  code: string
  description: string | null
  category: 'pessoal' | 'habitacao' | 'automovel' | 'consolidacao' | 'empresarial'
  min_amount: number
  max_amount: number
  min_term_months: number
  max_term_months: number
  base_interest_rate: number
  min_interest_rate: number
  max_interest_rate: number
  min_income: number | null
  max_age: number | null
  min_age: number
  requires_guarantor: boolean
  requires_collateral: boolean
  opening_fee_percent: number
  opening_fee_fixed: number
  management_fee_annual: number
  early_payment_fee: number
  active: boolean
  priority_order: number
  created_at: string
  updated_at: string
}

export interface CreditProductFTI {
  id: string
  product_id: string
  version: string
  document_date: string
  effective_date: string
  expiry_date: string | null
  product_description: string
  target_customers: string | null
  eligibility_criteria: string | null
  interest_calculation: string | null
  associated_costs: string | null
  insurance_info: string | null
  early_termination: string | null
  contract_modification: string | null
  dispute_resolution: string | null
  regulatory_info: string | null
  complaints_procedure: string | null
  data_protection: string | null
  full_document_url: string | null
  annexes: any
  active: boolean
  approved: boolean
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export const productsService = {
  // Produtos
  getAll: async (params?: { category?: string; active?: boolean }) => {
    const { data } = await api.get('/products', { params })
    return data
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/products/${id}`)
    return data
  },

  create: async (product: Partial<CreditProduct>) => {
    const { data } = await api.post('/products', product)
    return data
  },

  update: async (id: string, product: Partial<CreditProduct>) => {
    const { data } = await api.put(`/products/${id}`, product)
    return data
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/products/${id}`)
    return data
  },

  // FTIs
  getFTIsByProduct: async (productId: string) => {
    const { data } = await api.get(`/products/${productId}/ftis`)
    return data
  },

  getActiveFTI: async (productId: string) => {
    const { data } = await api.get(`/products/${productId}/ftis/active`)
    return data
  },

  getFTIById: async (id: string) => {
    const { data } = await api.get(`/products/ftis/${id}`)
    return data
  },

  createFTI: async (fti: Partial<CreditProductFTI>) => {
    const { data } = await api.post('/products/ftis', fti)
    return data
  },

  updateFTI: async (id: string, fti: Partial<CreditProductFTI>) => {
    const { data } = await api.put(`/products/ftis/${id}`, fti)
    return data
  },

  deleteFTI: async (id: string) => {
    const { data } = await api.delete(`/products/ftis/${id}`)
    return data
  },

  approveFTI: async (id: string) => {
    const { data } = await api.post(`/products/ftis/${id}/approve`)
    return data
  },
}
