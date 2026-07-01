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
  
  created_at: Date
  updated_at: Date
  created_by: string | null
  updated_by: string | null
}

export interface CreditProductFTI {
  id: string
  product_id: string
  version: string
  
  document_date: Date
  effective_date: Date
  expiry_date: Date | null
  
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
  annexes: any | null
  
  active: boolean
  approved: boolean
  approved_by: string | null
  approved_at: Date | null
  
  created_at: Date
  updated_at: Date
  created_by: string | null
  updated_by: string | null
}

export interface CreditProductHistory {
  id: string
  product_id: string
  changed_by: string | null
  change_type: 'created' | 'updated' | 'activated' | 'deactivated' | 'deleted'
  changes: any
  reason: string | null
  created_at: Date
}
