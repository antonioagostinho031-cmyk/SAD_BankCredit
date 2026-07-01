import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, CheckCircle, Plus } from 'lucide-react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { productsService } from '../../services/products.service'
import { usePermissions } from '../../hooks/usePermissions'
import { formatDate } from '../../lib/utils'

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

interface CreditProductFTI {
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

interface ProductFTIModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
}

export function ProductFTIModal({ isOpen, onClose, productId }: ProductFTIModalProps) {
  const [selectedFTI, setSelectedFTI] = useState<CreditProductFTI | null>(null)
  const queryClient = useQueryClient()
  const { canUpdateProduct } = usePermissions()

  // Buscar o produto
  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsService.getById(productId),
    enabled: isOpen,
  })

  const { data: ftis = [], isLoading } = useQuery({
    queryKey: ['product-ftis', productId],
    queryFn: () => productsService.getFTIsByProduct(productId),
    enabled: isOpen,
  })

  const approveMutation = useMutation({
    mutationFn: (ftiId: string) => productsService.approveFTI(ftiId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-ftis', productId] })
    },
  })

  const handleViewFTI = (fti: CreditProductFTI) => {
    setSelectedFTI(fti)
  }

  const handleApprove = (ftiId: string) => {
    if (confirm('Deseja aprovar esta FTI? Esta aco no pode ser revertida.')) {
      approveMutation.mutate(ftiId)
    }
  }

  if (!isOpen || !product) return null

  // Se houver FTI selecionada, mostrar detalhes
  if (selectedFTI) {
    return (
      <Modal 
        open={isOpen} 
        onClose={() => setSelectedFTI(null)}
        title={`FTI - ${product.name} (v${selectedFTI.version})`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Header com status */}
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="text-sm text-gray-600">Verso: <strong>{selectedFTI.version}</strong></p>
              <p className="text-sm text-gray-600">
                Data do Documento: <strong>{formatDate(selectedFTI.document_date)}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Em Vigor desde: <strong>{formatDate(selectedFTI.effective_date)}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedFTI.approved ? (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-[#0097A9]/10 text-[#0097A9]">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aprovada
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-600">
                    Pendente Aprovação
                  </span>
                  {canUpdateProduct() && (
                    <Button
                      onClick={() => handleApprove(selectedFTI.id)}
                      size="sm"
                      disabled={approveMutation.isPending}
                    >
                      Aprovar FTI
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Contedo da FTI em formato tabular */}
          <div className="space-y-4">
            <Section title="Descrio do Produto" content={selectedFTI.product_description} />
            {selectedFTI.target_customers && (
              <Section title="Clientes Alvo" content={selectedFTI.target_customers} />
            )}
            {selectedFTI.eligibility_criteria && (
              <Section title="Critrios de Elegibilidade" content={selectedFTI.eligibility_criteria} />
            )}
            {selectedFTI.interest_calculation && (
              <Section title="Clculo de Juros" content={selectedFTI.interest_calculation} />
            )}
            {selectedFTI.associated_costs && (
              <Section title="Custos Associados" content={selectedFTI.associated_costs} />
            )}
            {selectedFTI.insurance_info && (
              <Section title="Seguros" content={selectedFTI.insurance_info} />
            )}
            {selectedFTI.early_termination && (
              <Section title="Reembolso Antecipado" content={selectedFTI.early_termination} />
            )}
            {selectedFTI.contract_modification && (
              <Section title="Modificao Contratual" content={selectedFTI.contract_modification} />
            )}
            {selectedFTI.dispute_resolution && (
              <Section title="Resoluo de Litgios" content={selectedFTI.dispute_resolution} />
            )}
            {selectedFTI.regulatory_info && (
              <Section title="Informao Regulamentar" content={selectedFTI.regulatory_info} />
            )}
            {selectedFTI.complaints_procedure && (
              <Section title="Procedimento de Reclamaes" content={selectedFTI.complaints_procedure} />
            )}
            {selectedFTI.data_protection && (
              <Section title="Proteco de Dados" content={selectedFTI.data_protection} />
            )}
          </div>

          {/* Botes de aco */}
          <div className="flex items-center justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setSelectedFTI(null)}>
              Voltar  Lista
            </Button>
            {selectedFTI.full_document_url && (
              <Button variant="outline" onClick={() => window.open(selectedFTI.full_document_url!, '_blank')}>
                <FileText className="h-4 w-4 mr-2" />
                Documento Completo
              </Button>
            )}
          </div>
        </div>
      </Modal>
    )
  }

  // Lista de FTIs
  return (
    <Modal 
      open={isOpen} 
      onClose={onClose}
      title={`FTIs - ${product?.name || 'Produto'}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Fichas Tcnicas de Informao disponveis para este produto
          </p>
          {canUpdateProduct() && (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova FTI
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-gray-500">A carregar FTIs...</p>
          </div>
        ) : ftis.length === 0 ? (
          <div className="flex h-48 items-center justify-center border border-dashed rounded-lg">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Nenhuma FTI disponvel</p>
              <p className="text-sm text-gray-400 mt-1">Crie a primeira FTI para este produto</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Verso</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data Documento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vigncia</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Aces</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ftis.map((fti: CreditProductFTI) => (
                  <tr key={fti.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{fti.version}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(fti.document_date)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(fti.effective_date)}
                      {fti.expiry_date && ` - ${formatDate(fti.expiry_date)}`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {fti.active && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600">
                            Ativa
                          </span>
                        )}
                        {fti.approved ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-[#0097A9]/10 text-[#0097A9]">
                            Aprovada
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600">
                            Pendente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewFTI(fti)}
                          className="rounded-md px-3 py-1 text-sm font-medium text-[#0097A9] hover:bg-gray-50 transition-colors"
                        >
                          Ver Detalhes
                        </button>
                        {canUpdateProduct() && !fti.approved && (
                          <button
                            onClick={() => handleApprove(fti.id)}
                            className="rounded-md px-3 py-1 text-sm font-medium text-[#0097A9] hover:bg-[#0097A9]/5 transition-colors"
                            disabled={approveMutation.isPending}
                          >
                            Aprovar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Componente auxiliar para sees da FTI
function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 uppercase">{title}</h3>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-gray-700 whitespace-pre-line">{content}</p>
      </div>
    </div>
  )
}

