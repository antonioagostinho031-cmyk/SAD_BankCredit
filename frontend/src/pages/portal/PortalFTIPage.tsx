import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, FileText, AlertCircle, Info } from 'lucide-react'
import { PortalLayout } from '../../components/portal/PortalLayout'
import { productsService } from '../../services/products.service'
import { formatCurrency } from '../../lib/utils'

// ── Tipos ──────────────────────────────────────────────────────────────────
interface CreditProduct {
  id: string
  name: string
  code: string
  description: string | null
  category: string
  min_amount: number
  max_amount: number
  min_term_months: number
  max_term_months: number
  base_interest_rate: number
  min_interest_rate: number
  max_interest_rate: number
  opening_fee_percent: number
  opening_fee_fixed: number
  management_fee_annual: number
  early_payment_fee: number
  min_income: number | null
  min_age: number
  max_age: number | null
  requires_guarantor: boolean
  requires_collateral: boolean
  active: boolean
}

interface CreditProductFTI {
  id: string
  product_id: string
  version: string
  document_date: string
  effective_date: string
  expiry_date: string | null
  product_description: string | null
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
  active: boolean
  approved: boolean
  approved_at: string | null
}

// ── Componente auxiliar de secção ──────────────────────────────────────────
function Section({ title, icon, children }: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
        {icon}
        <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function PortalFTIPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const {
    data: product,
    isLoading: loadingProduct,
    isError: productError,
  } = useQuery<CreditProduct>({
    queryKey: ['product', id],
    queryFn: () => productsService.getById(id!),
    enabled: !!id,
    retry: 1,
  })

  const { data: fti, isLoading: loadingFTI } = useQuery<CreditProductFTI>({
    queryKey: ['product-fti-active', id],
    queryFn: () => productsService.getActiveFTI(id!),
    enabled: !!id,
    retry: false,
  })

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loadingProduct || loadingFTI) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#0097A9] mx-auto mb-3" />
            <p className="text-sm text-gray-400">A carregar ficha técnica...</p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  // ── Produto não encontrado ───────────────────────────────────────────────
  if (productError || !product) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Produto não encontrado.</p>
            <button
              onClick={() => navigate('/portal/credito')}
              className="mt-3 text-[#0097A9] text-sm hover:underline"
            >
              Voltar aos produtos
            </button>
          </div>
        </div>
      </PortalLayout>
    )
  }

  // ── Tabela de comissões construída a partir dos campos do produto ─────────
  type FeeRow = { name: string; value: string; when: string }
  const fees: FeeRow[] = []

  if (product.opening_fee_percent > 0) {
    fees.push({
      name: 'Comissão de Abertura',
      value: `${product.opening_fee_percent}% do capital`,
      when: 'Na concessão do crédito',
    })
  } else {
    fees.push({ name: 'Comissão de Abertura', value: 'Isenta', when: 'Na concessão do crédito' })
  }

  if (product.opening_fee_fixed > 0) {
    fees.push({
      name: 'Taxa mínima de abertura',
      value: formatCurrency(product.opening_fee_fixed),
      when: 'Na concessão do crédito',
    })
  }

  if (product.management_fee_annual > 0) {
    fees.push({
      name: 'Comissão de Gestão Anual',
      value: formatCurrency(product.management_fee_annual),
      when: 'Anualmente',
    })
  } else {
    fees.push({ name: 'Comissão de Gestão Anual', value: 'Isenta', when: 'Anualmente' })
  }

  fees.push(
    product.early_payment_fee > 0
      ? {
          name: 'Amortização Antecipada',
          value: `${product.early_payment_fee}% sobre o capital em dívida`,
          when: 'Quando aplicável',
        }
      : { name: 'Amortização Antecipada', value: 'Isenta', when: 'Quando aplicável' }
  )

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <PortalLayout>
      <div className="space-y-5">

        {/* ── Cabeçalho ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate('/portal/credito')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors mt-0.5 shrink-0"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {product.code}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Ficha Técnica de Informação (FTI)
                {fti && (
                  <span className="ml-2 text-xs text-gray-400">
                    v{fti.version}
                    {fti.effective_date && (
                      <> — vigente desde {new Date(fti.effective_date).toLocaleDateString('pt-PT')}</>
                    )}
                  </span>
                )}
              </p>
            </div>
          </div>
          {fti?.approved && (
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              Aprovada
            </span>
          )}
        </div>

        {/* ── Aviso regulamentar ─────────────────────────────────── */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Este documento contém as condições essenciais do produto.
            Leia atentamente antes de solicitar o crédito.
          </p>
        </div>

        {/* ── Aviso FTI não disponível ─────────────────────────── */}
        {!fti && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              A ficha técnica detalhada deste produto ainda não está publicada.
              As condições gerais são apresentadas abaixo.
            </p>
          </div>
        )}

        {/* ── Montantes e Prazos ─────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Montante Mínimo', value: formatCurrency(product.min_amount) },
            { label: 'Montante Máximo', value: formatCurrency(product.max_amount) },
            { label: 'Prazo Mínimo',    value: `${product.min_term_months} meses` },
            { label: 'Prazo Máximo',    value: `${product.max_term_months} meses` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="font-bold text-[#0097A9] text-lg leading-tight">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Taxas de Juro ─────────────────────────────────────── */}
        <Section title="Taxas de Juro">
          <div className="grid grid-cols-3 gap-4 mb-0">
            {[
              { label: 'TAN Base',    value: `${product.base_interest_rate.toFixed(2)}%`, highlight: true },
              { label: 'TAN Mínima', value: `${product.min_interest_rate.toFixed(2)}%`,  highlight: false },
              { label: 'TAN Máxima', value: `${product.max_interest_rate.toFixed(2)}%`,  highlight: false },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${highlight ? 'text-[#0097A9]' : 'text-gray-700'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
          {fti?.interest_calculation && (
            <p className="text-sm text-gray-600 leading-relaxed mt-4 pt-4 border-t border-gray-100">
              {fti.interest_calculation}
            </p>
          )}
        </Section>

        {/* ── Descrição do Produto ──────────────────────────────── */}
        {(fti?.product_description || product.description) && (
          <Section title="Descrição do Produto" icon={<FileText className="h-3.5 w-3.5 text-gray-400" />}>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {fti?.product_description ?? product.description}
            </p>
            {fti?.target_customers && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Destinatários</p>
                <p className="text-sm text-gray-700">{fti.target_customers}</p>
              </div>
            )}
          </Section>
        )}

        {/* ── Comissões e Encargos ──────────────────────────────── */}
        <Section title="Comissões e Encargos">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-6 text-xs font-semibold text-gray-600">Tipo</th>
                  <th className="text-left py-2 pr-6 text-xs font-semibold text-gray-600">Valor</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-600">Quando</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fees.map((fee, idx) => (
                  <tr key={idx}>
                    <td className="py-3 pr-6 text-gray-900">{fee.name}</td>
                    <td className="py-3 pr-6 text-gray-700 font-medium">{fee.value}</td>
                    <td className="py-3 text-gray-500 text-xs">{fee.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fti?.associated_costs && (
            <p className="text-sm text-gray-600 leading-relaxed mt-4 pt-4 border-t border-gray-100 whitespace-pre-line">
              {fti.associated_costs}
            </p>
          )}
        </Section>

        {/* ── Condições de Acesso ───────────────────────────────── */}
        {fti?.eligibility_criteria && (
          <Section title="Condições de Acesso">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {fti.eligibility_criteria}
            </p>
            {product.min_income && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Rendimento mínimo</p>
                  <p className="font-semibold text-gray-800 mt-1">{formatCurrency(product.min_income)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Idade mínima</p>
                  <p className="font-semibold text-gray-800 mt-1">{product.min_age} anos</p>
                </div>
                {product.max_age && (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Idade máxima</p>
                    <p className="font-semibold text-gray-800 mt-1">{product.max_age} anos</p>
                  </div>
                )}
              </div>
            )}
          </Section>
        )}

        {/* ── Seguros Associados ────────────────────────────────── */}
        {fti?.insurance_info && (
          <Section title="Seguros Associados">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {fti.insurance_info}
            </p>
          </Section>
        )}

        {/* ── Amortização Antecipada ────────────────────────────── */}
        {fti?.early_termination && (
          <Section title="Amortização Antecipada">
            <p className="text-sm text-gray-700 leading-relaxed">{fti.early_termination}</p>
          </Section>
        )}

        {/* ── Modificação e Litígios ────────────────────────────── */}
        {(fti?.contract_modification || fti?.dispute_resolution) && (
          <Section title="Alteração e Resolução de Litígios">
            {fti?.contract_modification && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Modificação contratual</p>
                <p className="text-sm text-gray-700 leading-relaxed">{fti.contract_modification}</p>
              </div>
            )}
            {fti?.dispute_resolution && (
              <div className={fti?.contract_modification ? 'mt-4 pt-4 border-t border-gray-100' : ''}>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Resolução de litígios</p>
                <p className="text-sm text-gray-700 leading-relaxed">{fti.dispute_resolution}</p>
              </div>
            )}
          </Section>
        )}

        {/* ── Reclamações ───────────────────────────────────────── */}
        {fti?.complaints_procedure && (
          <Section title="Procedimento de Reclamações">
            <p className="text-sm text-gray-700 leading-relaxed">{fti.complaints_procedure}</p>
          </Section>
        )}

        {/* ── Enquadramento Regulamentar ────────────────────────── */}
        {fti?.regulatory_info && (
          <Section title="Enquadramento Regulamentar">
            <p className="text-sm text-gray-700 leading-relaxed">{fti.regulatory_info}</p>
          </Section>
        )}

        {/* ── Aviso Legal ───────────────────────────────────────── */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-900 mb-1">Aviso Legal</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              {fti?.data_protection
                ? fti.data_protection
                : `As condições aqui apresentadas são indicativas e podem variar em função da análise de risco do cliente. A concessão de crédito está sujeita a aprovação do banco. Informação válida à data de ${new Date().toLocaleDateString('pt-PT')}.`}
            </p>
          </div>
        </div>

        {/* ── Acção ─────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Pretende solicitar este crédito?</p>
            <p className="text-sm text-gray-500 mt-0.5">Inicie o processo de candidatura</p>
          </div>
          <button
            onClick={() => navigate(`/portal/credito/solicitar/${id}`)}
            className="bg-[#0097A9] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#007A8A] transition-colors"
          >
            Solicitar Crédito
          </button>
        </div>

      </div>
    </PortalLayout>
  )
}
