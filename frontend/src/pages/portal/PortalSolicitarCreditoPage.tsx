import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Upload, FileText, CheckCircle, AlertCircle,
  Calculator, Info, Loader2, Plus, Trash2, ShieldCheck, Lock,
} from 'lucide-react'
import { productsService } from '../../services/products.service'
import { creditRequestsService } from '../../services/credit-requests.service'
import { useAuth } from '../../hooks/useAuth'
import { formatCurrency } from '../../lib/utils'
import { PortalLayout } from '../../components/portal/PortalLayout'
import { NotificationModal, type NotificationType } from '../../components/ui/notification-modal'
import api from '../../services/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CreditProduct {
  id: string
  name: string
  code: string
  category: 'pessoal' | 'habitacao' | 'automovel' | 'consolidacao' | 'empresarial'
  min_amount: number
  max_amount: number
  min_term_months: number
  max_term_months: number
  base_interest_rate: number
}

interface ClientProfile {
  id: string
  full_name: string
  employer: string | null
  job_title: string | null
  employment_type: string | null
  monthly_income: number | null
  is_eligible_for_credit: boolean
}

interface AccountStatus {
  has_updated_account: boolean
  missing_identity: boolean
  missing_employer: boolean
  client: ClientProfile | null
}

interface DebtEntry {
  creditor: string
  balance: string
  monthlyPayment: string
}

interface FormData {
  amount: string
  term: string
  purposeDescription: string
  income: string
  employment: string
  employerName: string
  yearsEmployed: string
  propertyType: string
  propertyProvince: string
  propertyEstimatedValue: string
  propertyUse: string
  downPayment: string
  hasGuarantor: boolean
  guarantorName: string
  guarantorNif: string
  vehicleBrand: string
  vehicleModel: string
  vehicleYear: string
  vehicleValue: string
  vehicleDownPayment: string
  vehicleCondition: string
  debts: DebtEntry[]
  companyNif: string
  companyLegalName: string
  businessSector: string
  yearsOfActivity: string
  annualRevenue: string
  numberOfEmployees: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INITIAL_FORM: FormData = {
  amount: '', term: '', purposeDescription: '',
  income: '', employment: '', employerName: '', yearsEmployed: '',
  propertyType: '', propertyProvince: '', propertyEstimatedValue: '',
  propertyUse: '', downPayment: '', hasGuarantor: false,
  guarantorName: '', guarantorNif: '',
  vehicleBrand: '', vehicleModel: '', vehicleYear: '',
  vehicleValue: '', vehicleDownPayment: '', vehicleCondition: '',
  debts: [{ creditor: '', balance: '', monthlyPayment: '' }],
  companyNif: '', companyLegalName: '', businessSector: '',
  yearsOfActivity: '', annualRevenue: '', numberOfEmployees: '',
}

const STEP_LABELS: Record<string, [string, string, string, string]> = {
  pessoal:      ['Montante & Prazo', 'Dados Financeiros',    'Documentos', 'Confirmação'],
  habitacao:    ['Montante & Prazo', 'Dados do Imóvel',      'Documentos', 'Confirmação'],
  automovel:    ['Montante & Prazo', 'Dados do Veículo',     'Documentos', 'Confirmação'],
  consolidacao: ['Montante & Prazo', 'Dívidas a Consolidar', 'Documentos', 'Confirmação'],
  empresarial:  ['Montante & Prazo', 'Dados Empresariais',   'Documentos', 'Confirmação'],
}

const CATEGORY_LABEL: Record<string, string> = {
  pessoal: 'Pessoal', habitacao: 'Habitação', automovel: 'Automóvel',
  consolidacao: 'Consolidação', empresarial: 'Empresarial',
}

const PROVINCES = [
  'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango',
  'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla',
  'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico',
  'Namibe', 'Uíge', 'Zaire',
]

const BUSINESS_SECTORS = [
  'Agricultura e Pecuária', 'Comércio a Retalho', 'Comércio a Grosso',
  'Construção Civil', 'Educação', 'Indústria Transformadora',
  'Mineração e Petróleos', 'Pesca', 'Saúde', 'Serviços Financeiros',
  'Tecnologia e Comunicações', 'Transportes e Logística',
  'Turismo e Hotelaria', 'Outro',
]

// Documentos por categoria:
// - sem identidade nem patronal (verificados na actualização de conta)
// - sem comprovativo de morada (verificado na actualização de conta)
// - sem extracto bancário (transações já constam na BD do banco)
interface DocItem { name: string; required: boolean }

const DOCS_BY_CATEGORY: Record<string, DocItem[]> = {
  pessoal: [
    { name: 'Declaração de IRT (último ano)',                  required: false },
  ],
  habitacao: [
    { name: 'Caderneta Predial do Imóvel',                     required: true  },
    { name: 'Certidão de Registo Predial',                     required: true  },
    { name: 'Orçamento de Obras (para renovações)',            required: false },
  ],
  automovel: [
    { name: 'Carta de Condução',                               required: true  },
    { name: 'Documento Único Automóvel (DUA) ou Proforma',     required: true  },
    { name: 'Factura / Proposta do Vendedor',                  required: false },
  ],
  consolidacao: [
    { name: 'Contratos de Crédito Actuais (todos)',            required: true  },
    { name: 'Comprovativos de Pagamento das Prestações',       required: true  },
  ],
  empresarial: [
    { name: 'NIF da Empresa (original e cópia)',               required: true  },
    { name: 'Certidão de Registo Comercial',                   required: true  },
    { name: 'Balancetes dos Últimos 2 Anos',                   required: true  },
    { name: 'Declaração Fiscal do Último Ano',                 required: true  },
    { name: 'Contrato Social / Acto Constitutivo',             required: false },
  ],
}

// ── Shared CSS strings ────────────────────────────────────────────────────────

const BASE_INPUT = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:border-transparent outline-none'
const INPUT_OK   = `${BASE_INPUT} border-gray-300 focus:ring-[#0097A9]`
const INPUT_ERR  = `${BASE_INPUT} border-red-400 focus:ring-red-400`
const INPUT_RO   = `${BASE_INPUT} border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed`
const SELECT_OK  = `${INPUT_OK} bg-white`
const SELECT_ERR = `${INPUT_ERR} bg-white`

// ── Component ─────────────────────────────────────────────────────────────────

export default function PortalSolicitarCreditoPage() {
  const navigate     = useNavigate()
  const { productId } = useParams<{ productId: string }>()
  const { user }     = useAuth()
  const queryClient  = useQueryClient()

  const [step, setStep]           = useState(1)
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [termsAccepted, setTerms] = useState(false)
  const [form, setForm]           = useState<FormData>(INITIAL_FORM)
  const [notification, setNotification] = useState<{ type: NotificationType; title?: string; message: string } | null>(null)

  // ── Account status check ─────────────────────────────────────
  const { data: accountStatus, isLoading: loadingStatus } = useQuery<AccountStatus>({
    queryKey: ['my-account-status'],
    queryFn: () => api.get('/clients/my-account-status').then(r => r.data),
    enabled: !!user,
    retry: false,
  })

  // ── Auto-fill employer fields when client profile loads ──────
  useEffect(() => {
    const client = accountStatus?.client
    if (!client) return
    setForm(prev => ({
      ...prev,
      income:       String(client.monthly_income ?? ''),
      employerName: client.employer ?? '',
      employment:   client.employment_type ?? '',
    }))
  }, [accountStatus?.client?.id])

  // ── Product data ─────────────────────────────────────────────
  const { data: product, isLoading: loadingProduct } = useQuery<CreditProduct>({
    queryKey: ['product', productId],
    queryFn:  () => productsService.getById(productId!),
    enabled:  !!productId,
  })

  const mutation = useMutation({
    mutationFn: (data: any) => creditRequestsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-credit-requests'] })
      setNotification({
        type: 'success',
        title: 'Pedido submetido com sucesso',
        message: 'O seu pedido de crédito foi registado e aguarda análise. Será notificado assim que houver uma actualização.',
      })
    },
    onError: (error: any) => {
      const raw = error.response?.data?.message ?? error.message
      const msg = Array.isArray(raw) ? raw.join('\n') : (raw ?? 'Ocorreu um erro inesperado. Tente novamente.')
      setNotification({ type: 'error', title: 'Erro ao submeter pedido', message: msg })
    },
  })

  // ── Derived values ───────────────────────────────────────────
  const category     = (product?.category ?? 'pessoal') as keyof typeof STEP_LABELS
  const steps        = STEP_LABELS[category] ?? STEP_LABELS.pessoal
  const docs         = DOCS_BY_CATEGORY[category] ?? DOCS_BY_CATEGORY.pessoal
  const monthlyRate  = (product?.base_interest_rate ?? 12) / 100 / 12
  const amountNum    = parseFloat(form.amount) || 0
  const termNum      = parseInt(form.term) || 0
  const monthlyPayment =
    amountNum > 0 && termNum > 0
      ? (amountNum * (monthlyRate * Math.pow(1 + monthlyRate, termNum))) /
        (Math.pow(1 + monthlyRate, termNum) - 1)
      : 0
  const totalPayment = monthlyPayment * termNum

  // ── Helpers ──────────────────────────────────────────────────
  const set = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const ic  = (field: string) => errors[field] ? INPUT_ERR  : INPUT_OK
  const sc  = (field: string) => errors[field] ? SELECT_ERR : SELECT_OK

  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {}
    if (!product) return e

    if (s === 1) {
      if (!form.amount) {
        e.amount = 'Montante é obrigatório'
      } else if (parseFloat(form.amount) < product.min_amount) {
        e.amount = `Mínimo: ${formatCurrency(product.min_amount)}`
      } else if (parseFloat(form.amount) > product.max_amount) {
        e.amount = `Máximo: ${formatCurrency(product.max_amount)}`
      }
      if (!form.term) {
        e.term = 'Prazo é obrigatório'
      } else if (parseInt(form.term) < product.min_term_months) {
        e.term = `Mínimo: ${product.min_term_months} meses`
      } else if (parseInt(form.term) > product.max_term_months) {
        e.term = `Máximo: ${product.max_term_months} meses`
      }
    }

    if (s === 2) {
      if (category === 'pessoal') {
        // employment pre-filled from account data — no validation required
      }
      if (category === 'habitacao') {
        if (!form.propertyType)           e.propertyType           = 'Tipo de imóvel é obrigatório'
        if (!form.propertyProvince)       e.propertyProvince       = 'Província é obrigatória'
        if (!form.propertyEstimatedValue) e.propertyEstimatedValue = 'Valor estimado é obrigatório'
        if (!form.propertyUse)            e.propertyUse            = 'Finalidade do imóvel é obrigatória'
        if (form.hasGuarantor && !form.guarantorName) e.guarantorName = 'Nome do garante é obrigatório'
      }
      if (category === 'automovel') {
        if (!form.vehicleBrand)     e.vehicleBrand     = 'Marca é obrigatória'
        if (!form.vehicleModel)     e.vehicleModel     = 'Modelo é obrigatório'
        if (!form.vehicleYear)      e.vehicleYear      = 'Ano é obrigatório'
        if (!form.vehicleValue)     e.vehicleValue     = 'Valor do veículo é obrigatório'
        if (!form.vehicleCondition) e.vehicleCondition = 'Estado do veículo é obrigatório'
      }
      if (category === 'consolidacao') {
        if (form.debts.length === 0 || form.debts.some((d) => !d.creditor || !d.balance))
          e.debts = 'Preencha o credor e saldo de todas as dívidas'
      }
      if (category === 'empresarial') {
        if (!form.companyNif)       e.companyNif       = 'NIF da empresa é obrigatório'
        if (!form.companyLegalName) e.companyLegalName = 'Nome da empresa é obrigatório'
        if (!form.businessSector)   e.businessSector   = 'Sector é obrigatório'
        if (!form.annualRevenue)    e.annualRevenue    = 'Volume de negócios é obrigatório'
        if (!form.yearsOfActivity)  e.yearsOfActivity  = 'Anos de actividade são obrigatórios'
      }
    }

    return e
  }

  const goNext = () => {
    const e = validateStep(step)
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setStep((s) => Math.min(s + 1, 4))
  }

  const goPrev = () => {
    setErrors({})
    setStep((s) => Math.max(s - 1, 1))
  }

  const buildMetadata = (): Record<string, any> => {
    if (category === 'pessoal') {
      return {
        income:         parseFloat(form.income) || null,
        employment:     form.employment || null,
        employer_name:  form.employerName || null,
        years_employed: parseFloat(form.yearsEmployed) || null,
      }
    }
    if (category === 'habitacao') {
      return {
        property_type:   form.propertyType || null,
        province:        form.propertyProvince || null,
        estimated_value: parseFloat(form.propertyEstimatedValue) || null,
        intended_use:    form.propertyUse || null,
        down_payment:    parseFloat(form.downPayment) || null,
        has_guarantor:   form.hasGuarantor,
        guarantor_name:  form.hasGuarantor ? (form.guarantorName || null) : null,
        guarantor_nif:   form.hasGuarantor ? (form.guarantorNif || null)  : null,
      }
    }
    if (category === 'automovel') {
      return {
        brand:         form.vehicleBrand || null,
        model:         form.vehicleModel || null,
        year:          parseInt(form.vehicleYear) || null,
        condition:     form.vehicleCondition || null,
        vehicle_value: parseFloat(form.vehicleValue) || null,
        down_payment:  parseFloat(form.vehicleDownPayment) || null,
      }
    }
    if (category === 'consolidacao') {
      const debts = form.debts
        .filter((d) => d.creditor)
        .map((d) => ({
          creditor:        d.creditor,
          balance:         parseFloat(d.balance) || 0,
          monthly_payment: parseFloat(d.monthlyPayment) || 0,
        }))
      return { debts, total_debt: debts.reduce((s, d) => s + d.balance, 0) }
    }
    if (category === 'empresarial') {
      return {
        company_nif:         form.companyNif || null,
        company_name:        form.companyLegalName || null,
        business_sector:     form.businessSector || null,
        years_of_activity:   parseInt(form.yearsOfActivity) || null,
        annual_revenue:      parseFloat(form.annualRevenue) || null,
        number_of_employees: parseInt(form.numberOfEmployees) || null,
      }
    }
    return {}
  }

  const handleSubmit = () => {
    if (!termsAccepted) {
      setNotification({ type: 'warning', title: 'Termos não aceites', message: 'Deve aceitar os termos e condições para prosseguir.' })
      return
    }
    if (!user?.id) {
      setNotification({ type: 'error', title: 'Sessão expirada', message: 'A sua sessão expirou. Por favor, faça login novamente.' })
      return
    }

    const purposeMap: Record<string, string> = {
      pessoal: 'pessoal', habitacao: 'habitacao', automovel: 'automovel',
      empresarial: 'negocio', consolidacao: 'consolidacao',
    }

    mutation.mutate({
      client_id:           accountStatus?.client?.id ?? user.id,
      product_id:          product?.id || undefined,
      requested_amount:    parseFloat(form.amount),
      term_months:         parseInt(form.term),
      purpose:             purposeMap[category] ?? 'outros',
      purpose_description: form.purposeDescription || null,
      metadata:            buildMetadata(),
    })
  }

  // ── Loading guard ─────────────────────────────────────────────
  if (loadingStatus || loadingProduct) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0097A9] mx-auto mb-3" />
            <p className="text-sm text-gray-400">A verificar conta...</p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  // ── Account NOT updated — blocking screen ────────────────────
  if (accountStatus && !accountStatus.has_updated_account) {
    return (
      <PortalLayout>
        <div className="max-w-lg mx-auto py-16 text-center space-y-5">
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Conta não actualizada</h2>
            <p className="mt-2 text-sm text-gray-500">
              Para solicitar crédito a sua conta precisa de ter os documentos de identidade e
              da entidade patronal verificados no sistema.
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-left space-y-2">
            <p className="text-sm font-semibold text-amber-800">Documentos em falta:</p>
            {accountStatus.missing_identity && (
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Documento de identidade verificado (BI, Passaporte ou Cartão de Residente)
              </div>
            )}
            {accountStatus.missing_employer && (
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Documento da entidade patronal verificado (Comprovativo de Vínculo ou Rendimento)
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Submeta um pedido de actualização de conta com os documentos em falta.
            Após verificação pelo seu gestor de conta, poderá solicitar crédito.
          </p>
          <div className="flex flex-col gap-2 items-center">
            <button
              onClick={() => navigate('/portal/conta/actualizar')}
              className="px-6 py-2.5 bg-[#0097A9] text-white text-sm font-semibold rounded-lg hover:bg-[#007A8A] transition-colors"
            >
              Actualizar Conta Agora
            </button>
            <button
              onClick={() => navigate('/portal/credito')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Voltar aos produtos
            </button>
          </div>
        </div>
      </PortalLayout>
    )
  }

  if (!product) {
    return (
      <PortalLayout>
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Produto não encontrado</h2>
          <button
            onClick={() => navigate('/portal/credito')}
            className="mt-4 text-sm text-[#0097A9] hover:underline"
          >
            Voltar aos produtos
          </button>
        </div>
      </PortalLayout>
    )
  }

  const clientProfile = accountStatus?.client

  // ── Main render ───────────────────────────────────────────────
  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── Cabeçalho ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/portal/credito')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Solicitar Crédito</h1>
            <p className="text-sm text-gray-500 truncate">
              {product.name}&nbsp;·&nbsp;
              <span className="font-mono text-xs text-gray-400">{product.code}</span>
            </p>
          </div>
          <span className="ml-auto shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
            {CATEGORY_LABEL[category] ?? category}
          </span>
        </div>

        {/* ── Progress ──────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <div className="flex items-start">
            {steps.map((label, idx) => {
              const n    = idx + 1
              const done = n < step
              const active = n === step
              return (
                <div key={n} className="flex items-start flex-1 min-w-0">
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        done   ? 'bg-[#0097A9] text-white' :
                        active ? 'bg-[#0097A9] text-white ring-4 ring-[#0097A9]/20' :
                                 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {done ? <CheckCircle className="h-3.5 w-3.5" /> : n}
                    </div>
                    <span className={`mt-1.5 text-xs font-medium text-center leading-tight px-1 ${
                      active ? 'text-[#0097A9]' : done ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {label}
                    </span>
                  </div>
                  {n < 4 && (
                    <div className={`flex-1 h-0.5 mt-3.5 mx-1 transition-colors ${
                      done ? 'bg-[#0097A9]' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Form card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">

          {/* ===================================================== */}
          {/* STEP 1 — Montante & Prazo                             */}
          {/* ===================================================== */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Montante e Prazo do Crédito</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Montante Pretendido (AOA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => set('amount', e.target.value)}
                    min={product.min_amount}
                    max={product.max_amount}
                    className={ic('amount')}
                    placeholder={`${product.min_amount} – ${product.max_amount}`}
                  />
                  {errors.amount ? (
                    <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatCurrency(product.min_amount)} – {formatCurrency(product.max_amount)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Prazo (meses) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.term}
                    onChange={(e) => set('term', e.target.value)}
                    min={product.min_term_months}
                    max={product.max_term_months}
                    className={ic('term')}
                    placeholder={`${product.min_term_months} – ${product.max_term_months}`}
                  />
                  {errors.term ? (
                    <p className="text-xs text-red-500 mt-1">{errors.term}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      {product.min_term_months} – {product.max_term_months} meses
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descrição / Finalidade
                </label>
                <textarea
                  value={form.purposeDescription}
                  onChange={(e) => set('purposeDescription', e.target.value)}
                  rows={3}
                  className={`${INPUT_OK} resize-none`}
                  placeholder={
                    category === 'habitacao'    ? 'Ex.: Aquisição de apartamento T3 no Talatona, Luanda...' :
                    category === 'automovel'    ? 'Ex.: Aquisição de Toyota Corolla 2022 para uso pessoal...' :
                    category === 'consolidacao' ? 'Ex.: Consolidação de crédito pessoal e automóvel para reduzir prestação mensal...' :
                    category === 'empresarial'  ? 'Ex.: Capital de maneio para expansão da actividade comercial...' :
                    'Descreva brevemente para que pretende utilizar este crédito...'
                  }
                />
              </div>

              {amountNum > 0 && termNum > 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4 text-teal-700" />
                    <span className="text-sm font-semibold text-teal-700">Simulação Indicativa</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-teal-600 mb-0.5">Prestação Mensal</p>
                      <p className="text-xl font-bold text-teal-700">{formatCurrency(monthlyPayment)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Total a Pagar</p>
                      <p className="text-base font-semibold text-gray-800">{formatCurrency(totalPayment)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">TAN</p>
                      <p className="text-base font-semibold text-gray-800">{product.base_interest_rate.toFixed(2)}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-teal-600/70 mt-3 text-center">
                    * Valores indicativos. Sujeito a análise e aprovação de crédito.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ===================================================== */}
          {/* STEP 2 — Detalhes específicos por categoria           */}
          {/* ===================================================== */}
          {step === 2 && (
            <div className="space-y-5">

              {/* ── PESSOAL ── */}
              {category === 'pessoal' && (
                <>
                  <h2 className="text-base font-semibold text-gray-900">Dados Financeiros e Profissionais</h2>

                  {/* Dados verificados — banner */}
                  <div className="flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3">
                    <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-teal-700">
                      Os dados de rendimento e entidade patronal abaixo foram preenchidos com base
                      nos documentos verificados na actualização de conta. Não é possível alterá-los aqui.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Rendimento Mensal Líquido (AOA)
                        <Lock className="inline-block h-3 w-3 ml-1 text-gray-400" />
                      </label>
                      <input
                        type="number"
                        value={form.income}
                        readOnly
                        className={INPUT_RO}
                        placeholder="Não disponível"
                      />
                      <p className="text-xs text-gray-400 mt-1">Valor dos documentos verificados</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Situação Profissional
                        <Lock className="inline-block h-3 w-3 ml-1 text-gray-400" />
                      </label>
                      <input
                        type="text"
                        value={form.employment}
                        readOnly
                        className={INPUT_RO}
                        placeholder="Não disponível"
                      />
                      <p className="text-xs text-gray-400 mt-1">Valor dos documentos verificados</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Entidade Empregadora
                        <Lock className="inline-block h-3 w-3 ml-1 text-gray-400" />
                      </label>
                      <input
                        type="text"
                        value={form.employerName}
                        readOnly
                        className={INPUT_RO}
                        placeholder="Não disponível"
                      />
                      <p className="text-xs text-gray-400 mt-1">Valor dos documentos verificados</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Anos de Antiguidade
                      </label>
                      <input
                        type="number"
                        value={form.yearsEmployed}
                        onChange={(e) => set('yearsEmployed', e.target.value)}
                        className={INPUT_OK}
                        placeholder="Ex.: 5"
                        min={0}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── HABITAÇÃO ── */}
              {category === 'habitacao' && (
                <>
                  <h2 className="text-base font-semibold text-gray-900">Dados do Imóvel</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Tipo de Imóvel <span className="text-red-500">*</span>
                      </label>
                      <select value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)} className={sc('propertyType')}>
                        <option value="">Selecione...</option>
                        <option value="Apartamento">Apartamento</option>
                        <option value="Vivenda / Moradia">Vivenda / Moradia</option>
                        <option value="Terreno">Terreno</option>
                        <option value="Sala Comercial">Sala Comercial</option>
                        <option value="Outro">Outro</option>
                      </select>
                      {errors.propertyType && <p className="text-xs text-red-500 mt-1">{errors.propertyType}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Província <span className="text-red-500">*</span>
                      </label>
                      <select value={form.propertyProvince} onChange={(e) => set('propertyProvince', e.target.value)} className={sc('propertyProvince')}>
                        <option value="">Selecione...</option>
                        {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {errors.propertyProvince && <p className="text-xs text-red-500 mt-1">{errors.propertyProvince}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Finalidade <span className="text-red-500">*</span>
                      </label>
                      <select value={form.propertyUse} onChange={(e) => set('propertyUse', e.target.value)} className={sc('propertyUse')}>
                        <option value="">Selecione...</option>
                        <option value="Aquisição">Aquisição (Compra)</option>
                        <option value="Construção">Construção</option>
                        <option value="Renovação / Obras">Renovação / Obras</option>
                        <option value="Permuta">Permuta</option>
                      </select>
                      {errors.propertyUse && <p className="text-xs text-red-500 mt-1">{errors.propertyUse}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Valor Estimado do Imóvel (AOA) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={form.propertyEstimatedValue}
                        onChange={(e) => set('propertyEstimatedValue', e.target.value)}
                        className={ic('propertyEstimatedValue')}
                        placeholder="Valor de mercado estimado"
                      />
                      {errors.propertyEstimatedValue && <p className="text-xs text-red-500 mt-1">{errors.propertyEstimatedValue}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Entrada / Capital Próprio (AOA)
                    </label>
                    <input
                      type="number"
                      value={form.downPayment}
                      onChange={(e) => set('downPayment', e.target.value)}
                      className={INPUT_OK}
                      placeholder="Valor disponível como entrada (opcional)"
                    />
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.hasGuarantor}
                        onChange={(e) => set('hasGuarantor', e.target.checked)}
                        className="h-4 w-4 text-[#0097A9] border-gray-300 rounded focus:ring-[#0097A9]"
                      />
                      <span className="text-sm font-medium text-gray-700">Tenho um garante / fiador</span>
                    </label>
                    {form.hasGuarantor && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nome do Garante <span className="text-red-500">*</span>
                          </label>
                          <input type="text" value={form.guarantorName} onChange={(e) => set('guarantorName', e.target.value)} className={ic('guarantorName')} placeholder="Nome completo" />
                          {errors.guarantorName && <p className="text-xs text-red-500 mt-1">{errors.guarantorName}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">NIF do Garante</label>
                          <input type="text" value={form.guarantorNif} onChange={(e) => set('guarantorNif', e.target.value)} className={INPUT_OK} placeholder="Número de identificação fiscal" />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── AUTOMÓVEL ── */}
              {category === 'automovel' && (
                <>
                  <h2 className="text-base font-semibold text-gray-900">Dados do Veículo</h2>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Marca <span className="text-red-500">*</span></label>
                      <input type="text" value={form.vehicleBrand} onChange={(e) => set('vehicleBrand', e.target.value)} className={ic('vehicleBrand')} placeholder="Ex.: Toyota" />
                      {errors.vehicleBrand && <p className="text-xs text-red-500 mt-1">{errors.vehicleBrand}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Modelo <span className="text-red-500">*</span></label>
                      <input type="text" value={form.vehicleModel} onChange={(e) => set('vehicleModel', e.target.value)} className={ic('vehicleModel')} placeholder="Ex.: Corolla" />
                      {errors.vehicleModel && <p className="text-xs text-red-500 mt-1">{errors.vehicleModel}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Ano <span className="text-red-500">*</span></label>
                      <input type="number" value={form.vehicleYear} onChange={(e) => set('vehicleYear', e.target.value)} className={ic('vehicleYear')} placeholder="Ex.: 2022" min={1990} max={2027} />
                      {errors.vehicleYear && <p className="text-xs text-red-500 mt-1">{errors.vehicleYear}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado <span className="text-red-500">*</span></label>
                      <select value={form.vehicleCondition} onChange={(e) => set('vehicleCondition', e.target.value)} className={sc('vehicleCondition')}>
                        <option value="">Selecione...</option>
                        <option value="Novo">Novo</option>
                        <option value="Semi-Novo">Semi-Novo</option>
                        <option value="Usado">Usado</option>
                      </select>
                      {errors.vehicleCondition && <p className="text-xs text-red-500 mt-1">{errors.vehicleCondition}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor do Veículo (AOA) <span className="text-red-500">*</span></label>
                      <input type="number" value={form.vehicleValue} onChange={(e) => set('vehicleValue', e.target.value)} className={ic('vehicleValue')} placeholder="Valor de compra" />
                      {errors.vehicleValue && <p className="text-xs text-red-500 mt-1">{errors.vehicleValue}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Entrada (AOA)</label>
                      <input type="number" value={form.vehicleDownPayment} onChange={(e) => set('vehicleDownPayment', e.target.value)} className={INPUT_OK} placeholder="Opcional" />
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      O veículo ficará hipotecado como garantia do crédito até ao seu integral pagamento.
                    </p>
                  </div>
                </>
              )}

              {/* ── CONSOLIDAÇÃO ── */}
              {category === 'consolidacao' && (
                <>
                  <h2 className="text-base font-semibold text-gray-900">Dívidas a Consolidar</h2>
                  <p className="text-sm text-gray-500">Indique todas as dívidas que pretende incluir neste processo de consolidação.</p>

                  {errors.debts && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600">{errors.debts}</p>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {form.debts.map((debt, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Credor <span className="text-red-400">*</span></label>
                          <input type="text" value={debt.creditor} onChange={(e) => { const n = [...form.debts]; n[idx] = { ...n[idx], creditor: e.target.value }; set('debts', n) }} className={INPUT_OK} placeholder="Ex.: Banco X" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Saldo em Dívida (AOA) <span className="text-red-400">*</span></label>
                          <input type="number" value={debt.balance} onChange={(e) => { const n = [...form.debts]; n[idx] = { ...n[idx], balance: e.target.value }; set('debts', n) }} className={INPUT_OK} placeholder="Saldo actual" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Prestação Mensal (AOA)</label>
                          <input type="number" value={debt.monthlyPayment} onChange={(e) => { const n = [...form.debts]; n[idx] = { ...n[idx], monthlyPayment: e.target.value }; set('debts', n) }} className={INPUT_OK} placeholder="Prestação actual" />
                        </div>
                        <button onClick={() => { if (form.debts.length === 1) return; set('debts', form.debts.filter((_, i) => i !== idx)) }} disabled={form.debts.length === 1} className="mb-0.5 p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30" title="Remover">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => set('debts', [...form.debts, { creditor: '', balance: '', monthlyPayment: '' }])} className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#0097A9] text-[#0097A9] rounded-lg text-sm hover:bg-teal-50 transition-colors">
                    <Plus className="h-4 w-4" />
                    Adicionar Dívida
                  </button>
                </>
              )}

              {/* ── EMPRESARIAL ── */}
              {category === 'empresarial' && (
                <>
                  <h2 className="text-base font-semibold text-gray-900">Dados da Empresa</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">NIF da Empresa <span className="text-red-500">*</span></label>
                      <input type="text" value={form.companyNif} onChange={(e) => set('companyNif', e.target.value)} className={ic('companyNif')} placeholder="Ex.: 5000123456" />
                      {errors.companyNif && <p className="text-xs text-red-500 mt-1">{errors.companyNif}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Denominação Social <span className="text-red-500">*</span></label>
                      <input type="text" value={form.companyLegalName} onChange={(e) => set('companyLegalName', e.target.value)} className={ic('companyLegalName')} placeholder="Nome completo da empresa" />
                      {errors.companyLegalName && <p className="text-xs text-red-500 mt-1">{errors.companyLegalName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Sector de Actividade <span className="text-red-500">*</span></label>
                      <select value={form.businessSector} onChange={(e) => set('businessSector', e.target.value)} className={sc('businessSector')}>
                        <option value="">Selecione...</option>
                        {BUSINESS_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.businessSector && <p className="text-xs text-red-500 mt-1">{errors.businessSector}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Anos de Actividade <span className="text-red-500">*</span></label>
                      <input type="number" value={form.yearsOfActivity} onChange={(e) => set('yearsOfActivity', e.target.value)} className={ic('yearsOfActivity')} placeholder="Nº de anos" min={0} />
                      {errors.yearsOfActivity && <p className="text-xs text-red-500 mt-1">{errors.yearsOfActivity}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Volume de Negócios Anual (AOA) <span className="text-red-500">*</span></label>
                      <input type="number" value={form.annualRevenue} onChange={(e) => set('annualRevenue', e.target.value)} className={ic('annualRevenue')} placeholder="Facturação do último ano" />
                      {errors.annualRevenue && <p className="text-xs text-red-500 mt-1">{errors.annualRevenue}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nº de Colaboradores</label>
                      <input type="number" value={form.numberOfEmployees} onChange={(e) => set('numberOfEmployees', e.target.value)} className={INPUT_OK} placeholder="Total de funcionários" min={1} />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      As informações financeiras da empresa serão verificadas com os documentos entregues.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===================================================== */}
          {/* STEP 3 — Documentos                                   */}
          {/* ===================================================== */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Documentos Necessários</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Documentos para <strong className="text-gray-700">Crédito {CATEGORY_LABEL[category]}</strong>
                </p>
              </div>

              {/* Docs já verificados na conta */}
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                  <ShieldCheck className="h-4 w-4" />
                  Dados e documentos já verificados na actualização de conta
                </div>
                <div className="space-y-1.5 mt-1">
                  <div className="flex items-center gap-2 text-sm text-teal-600">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    Documento de identidade (BI, Passaporte ou Cartão de Residente)
                    {clientProfile?.full_name && (
                      <span className="text-xs text-teal-500 ml-1">— {clientProfile.full_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-teal-600">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    Documento da entidade patronal
                    {clientProfile?.employer && (
                      <span className="text-xs text-teal-500 ml-1">— {clientProfile.employer}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-teal-600">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    Comprovativo de morada
                  </div>
                  <div className="flex items-center gap-2 text-sm text-teal-600">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    Dados de transações bancárias (registados no sistema)
                  </div>
                </div>
              </div>

              {/* Docs adicionais específicos do produto */}
              {docs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Documentos adicionais a entregar
                  </p>
                  {docs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-[#0097A9]/40 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                          <span className={`inline-flex text-xs px-1.5 py-0.5 rounded mt-0.5 font-medium ${doc.required ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                            {doc.required ? 'Obrigatório' : 'Opcional'}
                          </span>
                        </div>
                      </div>
                      <button className="shrink-0 ml-4 flex items-center gap-1.5 px-3 py-1.5 bg-[#0097A9] text-white text-xs font-medium rounded hover:bg-[#007A8A] transition-colors">
                        <Upload className="h-3.5 w-3.5" />
                        Carregar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700">
                  <p className="font-semibold mb-0.5">Formatos aceites: PDF, JPG, PNG</p>
                  <p>Tamanho máximo por ficheiro: 5 MB. Todos os documentos devem estar legíveis e actualizados.</p>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Os documentos adicionais podem ser carregados agora ou posteriormente através do acompanhamento do seu pedido.
              </p>
            </div>
          )}

          {/* ===================================================== */}
          {/* STEP 4 — Confirmação                                  */}
          {/* ===================================================== */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Confirmação do Pedido</h2>

              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-200">
                <div className="bg-white px-4 py-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Produto & Condições</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4 text-sm">
                  <div><p className="text-xs text-gray-500 mb-0.5">Nome</p><p className="font-semibold text-gray-900">{product.name}</p></div>
                  <div><p className="text-xs text-gray-500 mb-0.5">Categoria</p><p className="font-semibold text-gray-900">{CATEGORY_LABEL[category]}</p></div>
                  <div><p className="text-xs text-gray-500 mb-0.5">Montante Solicitado</p><p className="font-semibold text-gray-900">{formatCurrency(parseFloat(form.amount || '0'))}</p></div>
                  <div><p className="text-xs text-gray-500 mb-0.5">Prazo</p><p className="font-semibold text-gray-900">{form.term} meses</p></div>
                  <div><p className="text-xs text-gray-500 mb-0.5">TAN</p><p className="font-semibold text-gray-900">{product.base_interest_rate.toFixed(2)}%</p></div>
                  <div><p className="text-xs text-gray-500 mb-0.5">Prestação Estimada</p><p className="font-semibold text-[#0097A9]">{formatCurrency(monthlyPayment)}</p></div>
                </div>

                {category === 'pessoal' && (form.income || form.employerName) && (
                  <>
                    <div className="bg-white px-4 py-2.5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados Financeiros (Verificados)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4 text-sm">
                      {form.income      && <div><p className="text-xs text-gray-500 mb-0.5">Rendimento</p><p className="font-semibold">{formatCurrency(parseFloat(form.income))}</p></div>}
                      {form.employment  && <div><p className="text-xs text-gray-500 mb-0.5">Situação</p><p className="font-semibold">{form.employment}</p></div>}
                      {form.employerName && <div><p className="text-xs text-gray-500 mb-0.5">Empregador</p><p className="font-semibold">{form.employerName}</p></div>}
                      {form.yearsEmployed && <div><p className="text-xs text-gray-500 mb-0.5">Antiguidade</p><p className="font-semibold">{form.yearsEmployed} anos</p></div>}
                    </div>
                  </>
                )}

                {category === 'habitacao' && form.propertyType && (
                  <>
                    <div className="bg-white px-4 py-2.5"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados do Imóvel</p></div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4 text-sm">
                      {form.propertyType           && <div><p className="text-xs text-gray-500 mb-0.5">Tipo</p><p className="font-semibold">{form.propertyType}</p></div>}
                      {form.propertyProvince        && <div><p className="text-xs text-gray-500 mb-0.5">Localização</p><p className="font-semibold">{form.propertyProvince}</p></div>}
                      {form.propertyEstimatedValue  && <div><p className="text-xs text-gray-500 mb-0.5">Valor Estimado</p><p className="font-semibold">{formatCurrency(parseFloat(form.propertyEstimatedValue))}</p></div>}
                      {form.propertyUse             && <div><p className="text-xs text-gray-500 mb-0.5">Finalidade</p><p className="font-semibold">{form.propertyUse}</p></div>}
                      {form.downPayment              && <div><p className="text-xs text-gray-500 mb-0.5">Entrada</p><p className="font-semibold">{formatCurrency(parseFloat(form.downPayment))}</p></div>}
                      {form.hasGuarantor && form.guarantorName && <div><p className="text-xs text-gray-500 mb-0.5">Garante</p><p className="font-semibold">{form.guarantorName}</p></div>}
                    </div>
                  </>
                )}

                {category === 'automovel' && form.vehicleBrand && (
                  <>
                    <div className="bg-white px-4 py-2.5"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados do Veículo</p></div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4 text-sm">
                      <div><p className="text-xs text-gray-500 mb-0.5">Veículo</p><p className="font-semibold">{[form.vehicleBrand, form.vehicleModel, form.vehicleYear].filter(Boolean).join(' ')}</p></div>
                      {form.vehicleCondition   && <div><p className="text-xs text-gray-500 mb-0.5">Estado</p><p className="font-semibold">{form.vehicleCondition}</p></div>}
                      {form.vehicleValue       && <div><p className="text-xs text-gray-500 mb-0.5">Valor</p><p className="font-semibold">{formatCurrency(parseFloat(form.vehicleValue))}</p></div>}
                      {form.vehicleDownPayment && <div><p className="text-xs text-gray-500 mb-0.5">Entrada</p><p className="font-semibold">{formatCurrency(parseFloat(form.vehicleDownPayment))}</p></div>}
                    </div>
                  </>
                )}

                {category === 'consolidacao' && form.debts.some((d) => d.creditor) && (
                  <>
                    <div className="bg-white px-4 py-2.5"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dívidas a Consolidar</p></div>
                    <div className="px-4 py-3 space-y-2">
                      {form.debts.filter((d) => d.creditor).map((d, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-700">{d.creditor}</span>
                          <span className="font-semibold">{formatCurrency(parseFloat(d.balance || '0'))}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-700">Total</span>
                        <span className="font-bold text-[#0097A9]">{formatCurrency(form.debts.reduce((s, d) => s + (parseFloat(d.balance) || 0), 0))}</span>
                      </div>
                    </div>
                  </>
                )}

                {category === 'empresarial' && form.companyLegalName && (
                  <>
                    <div className="bg-white px-4 py-2.5"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dados Empresariais</p></div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-4 text-sm">
                      {form.companyLegalName  && <div><p className="text-xs text-gray-500 mb-0.5">Empresa</p><p className="font-semibold">{form.companyLegalName}</p></div>}
                      {form.companyNif        && <div><p className="text-xs text-gray-500 mb-0.5">NIF</p><p className="font-semibold font-mono">{form.companyNif}</p></div>}
                      {form.businessSector    && <div><p className="text-xs text-gray-500 mb-0.5">Sector</p><p className="font-semibold">{form.businessSector}</p></div>}
                      {form.yearsOfActivity   && <div><p className="text-xs text-gray-500 mb-0.5">Anos de Actividade</p><p className="font-semibold">{form.yearsOfActivity}</p></div>}
                      {form.annualRevenue     && <div><p className="text-xs text-gray-500 mb-0.5">Volume Anual</p><p className="font-semibold">{formatCurrency(parseFloat(form.annualRevenue))}</p></div>}
                      {form.numberOfEmployees && <div><p className="text-xs text-gray-500 mb-0.5">Colaboradores</p><p className="font-semibold">{form.numberOfEmployees}</p></div>}
                    </div>
                  </>
                )}
              </div>

              <div
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors select-none ${termsAccepted ? 'border-teal-300 bg-teal-50/40' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                onClick={() => setTerms((v) => !v)}
              >
                <div className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${termsAccepted ? 'bg-[#0097A9] border-[#0097A9]' : 'border-gray-300'}`}>
                  {termsAccepted && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <p className="text-sm text-gray-700">
                  Li e aceito os{' '}
                  <span className="text-[#0097A9] hover:underline" onClick={(e) => e.stopPropagation()}>termos e condições</span>{' '}
                  e a{' '}
                  <span className="text-[#0097A9] hover:underline" onClick={(e) => e.stopPropagation()}>política de privacidade</span>.
                  Autorizo o Banco BAI a tratar os meus dados pessoais para efeitos de análise de crédito.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold mb-0.5">Próximo passo</p>
                  <p>Após a submissão, o seu pedido será analisado pela equipa de crédito. Receberá uma notificação com a decisão assim que o processo estiver concluído.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Navegação ─────────────────────────────────────────── */}
          <div className="flex justify-between pt-6 mt-6 border-t border-gray-100">
            <button
              onClick={goPrev}
              disabled={step === 1}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            {step < 4 ? (
              <button
                onClick={goNext}
                className="px-6 py-2.5 bg-[#0097A9] text-white text-sm font-semibold rounded-lg hover:bg-[#007A8A] transition-colors"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={mutation.isPending || !termsAccepted}
                className="px-6 py-2.5 bg-[#F5A623] text-white text-sm font-semibold rounded-lg hover:bg-[#E09615] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {mutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /><span>A Submeter...</span></>
                ) : (
                  'Submeter Pedido'
                )}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Professional notification modal — replaces browser alert() */}
      <NotificationModal
        open={!!notification}
        onClose={() => {
          const wasSuccess = notification?.type === 'success'
          setNotification(null)
          if (wasSuccess) navigate('/portal/credito/pedidos')
        }}
        type={notification?.type ?? 'info'}
        title={notification?.title}
        message={notification?.message ?? ''}
        confirmLabel={notification?.type === 'success' ? 'Ver os meus pedidos' : 'OK'}
      />
    </PortalLayout>
  )
}
