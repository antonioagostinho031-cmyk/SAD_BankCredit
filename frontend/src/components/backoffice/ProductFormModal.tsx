import { useState } from 'react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'

interface CreditProduct {
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
  grace_period_months?: number
  processing_fee_percentage?: number
  min_credit_score?: number
  max_ltv_ratio?: number
  collateral_types?: string[]
  required_documents?: string[]
  is_active?: boolean
  created_at: string
  updated_at: string
}

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<CreditProduct>) => Promise<void>
  product?: CreditProduct
  mode: 'create' | 'edit'
}

export function ProductFormModal({ isOpen, onClose, onSubmit, product, mode }: ProductFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<CreditProduct>>({
    name: product?.name || '',
    description: product?.description || '',
    min_amount: product?.min_amount || 0,
    max_amount: product?.max_amount || 0,
    min_term_months: product?.min_term_months || 12,
    max_term_months: product?.max_term_months || 60,
    base_interest_rate: product?.base_interest_rate || 0,
    max_interest_rate: product?.max_interest_rate || 0,
    grace_period_months: product?.grace_period_months || 0,
    processing_fee_percentage: product?.processing_fee_percentage || 0,
    min_credit_score: product?.min_credit_score || 0,
    max_ltv_ratio: product?.max_ltv_ratio || 0,
    requires_collateral: product?.requires_collateral || false,
    collateral_types: product?.collateral_types || [],
    required_documents: product?.required_documents || [],
    is_active: product?.is_active ?? true,
  })

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Erro ao submeter produto:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal 
      open={isOpen} 
      onClose={onClose} 
      title={mode === 'create' ? 'Criar Produto de Crédito' : 'Editar Produto de Crédito'}
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrio</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mnimo (AOA)</label>
              <input
                type="number"
                value={formData.min_amount}
                onChange={(e) => handleChange('min_amount', parseFloat(e.target.value))}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mximo (AOA)</label>
              <input
                type="number"
                value={formData.max_amount}
                onChange={(e) => handleChange('max_amount', parseFloat(e.target.value))}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prazo Mnimo (meses)</label>
              <input
                type="number"
                value={formData.min_term_months}
                onChange={(e) => handleChange('min_term_months', parseInt(e.target.value))}
                min="1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prazo Mximo (meses)</label>
              <input
                type="number"
                value={formData.max_term_months}
                onChange={(e) => handleChange('max_term_months', parseInt(e.target.value))}
                min="1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Juro Base (%)</label>
              <input
                type="number"
                value={formData.base_interest_rate}
                onChange={(e) => handleChange('base_interest_rate', parseFloat(e.target.value))}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Juro Mxima (%)</label>
              <input
                type="number"
                value={formData.max_interest_rate}
                onChange={(e) => handleChange('max_interest_rate', parseFloat(e.target.value))}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perodo de Carncia (meses)</label>
              <input
                type="number"
                value={formData.grace_period_months}
                onChange={(e) => handleChange('grace_period_months', parseInt(e.target.value))}
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Processamento (%)</label>
              <input
                type="number"
                value={formData.processing_fee_percentage}
                onChange={(e) => handleChange('processing_fee_percentage', parseFloat(e.target.value))}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Score Mnimo</label>
              <input
                type="number"
                value={formData.min_credit_score}
                onChange={(e) => handleChange('min_credit_score', parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LTV Mximo (%)</label>
              <input
                type="number"
                value={formData.max_ltv_ratio}
                onChange={(e) => handleChange('max_ltv_ratio', parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requires_collateral}
                  onChange={(e) => handleChange('requires_collateral', e.target.checked)}
                  className="rounded border-gray-300 text-[#0097A9] focus:ring-[#0097A9]"
                />
                <span className="text-sm font-medium text-gray-700">Requer Garantia</span>
              </label>
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                  className="rounded border-gray-300 text-[#0097A9] focus:ring-[#0097A9]"
                />
                <span className="text-sm font-medium text-gray-700">Produto Ativo</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'A guardar...' : mode === 'create' ? 'Criar Produto' : 'Guardar Alteraes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}


