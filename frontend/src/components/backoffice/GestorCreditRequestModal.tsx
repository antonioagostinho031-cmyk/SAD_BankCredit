import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, CreditCard, ShieldCheck, Lock } from 'lucide-react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import api from '../../services/api'
import { formatCurrency } from '../../lib/utils'

interface Product {
  id: string
  name: string
  min_amount: number
  max_amount: number
  min_term_months: number
  max_term_months: number
  base_interest_rate: number
  opening_fee_percent: number
  opening_fee_fixed: number
}

interface AccountStatus {
  has_updated_account: boolean
  missing_identity: boolean
  missing_employer: boolean
}

interface Props {
  client: { id: string; full_name: string; employer?: string | null; employment_type?: string | null; monthly_income?: number | null; job_title?: string | null }
  open: boolean
  onClose: () => void
}

const PURPOSE_OPTIONS = [
  { value: 'pessoal',       label: 'Crédito Pessoal' },
  { value: 'habitacao',     label: 'Habitação' },
  { value: 'automovel',     label: 'Automóvel' },
  { value: 'educacao',      label: 'Educação' },
  { value: 'saude',         label: 'Saúde' },
  { value: 'consolidacao',  label: 'Consolidação de Dívidas' },
  { value: 'negocio',       label: 'Negócio / Empresa' },
  { value: 'outros',        label: 'Outros' },
]

const ALL_TERM_OPTIONS = [
  { value: 6,   label: '6 meses' },
  { value: 12,  label: '12 meses' },
  { value: 24,  label: '24 meses' },
  { value: 36,  label: '36 meses' },
  { value: 48,  label: '48 meses' },
  { value: 60,  label: '5 anos (60 meses)' },
  { value: 84,  label: '7 anos (84 meses)' },
  { value: 120, label: '10 anos (120 meses)' },
  { value: 180, label: '15 anos (180 meses)' },
  { value: 240, label: '20 anos (240 meses)' },
  { value: 360, label: '30 anos (360 meses)' },
  { value: 420, label: '35 anos (420 meses)' },
]

export default function GestorCreditRequestModal({ client, open, onClose }: Props) {
  const queryClient = useQueryClient()

  const { data: accountStatus, isLoading: loadingStatus } = useQuery<AccountStatus>({
    queryKey: ['client-account-status', client.id],
    queryFn: () => api.get(`/clients/${client.id}/account-status`).then(r => r.data),
    enabled: open,
    retry: false,
  })

  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState('')
  const [amount, setAmount] = useState('')
  const [termMonths, setTermMonths] = useState('')
  const [purpose, setPurpose] = useState('pessoal')
  const [purposeDesc, setPurposeDesc] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const selectedProduct = products.find(p => p.id === productId) ?? null

  const termOptions = selectedProduct
    ? ALL_TERM_OPTIONS.filter(o => o.value >= selectedProduct.min_term_months && o.value <= selectedProduct.max_term_months)
    : ALL_TERM_OPTIONS

  useEffect(() => {
    if (open) {
      api.get('/products', { params: { active: 'true' } })
        .then(res => setProducts(res.data))
        .catch(console.error)
    }
  }, [open])

  useEffect(() => {
    if (selectedProduct) {
      setAmount(String(selectedProduct.min_amount))
      setTermMonths(String(termOptions[0]?.value ?? ''))
    }
  }, [productId])

  const mutation = useMutation({
    mutationFn: () => api.post('/credit', {
      client_id: client.id,
      product_id: productId || undefined,
      requested_amount: Number(amount),
      term_months: Number(termMonths),
      purpose,
      purpose_description: purposeDesc || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      queryClient.invalidateQueries({ queryKey: ['client-credits', client.id] })
      setSuccess(true)
    },
  })

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!productId) e.product = 'Selecione um produto de crédito'
    const amt = Number(amount)
    if (!amount || isNaN(amt) || amt <= 0) {
      e.amount = 'Montante obrigatório'
    } else if (selectedProduct) {
      if (amt < selectedProduct.min_amount)
        e.amount = `Mínimo: ${formatCurrency(selectedProduct.min_amount)}`
      if (amt > selectedProduct.max_amount)
        e.amount = `Máximo: ${formatCurrency(selectedProduct.max_amount)}`
    }
    if (!termMonths) e.term = 'Selecione um prazo'
    if (!purpose) e.purpose = 'Selecione a finalidade'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    mutation.mutate()
  }

  const handleClose = () => {
    setSuccess(false)
    setProductId('')
    setAmount('')
    setTermMonths('')
    setPurpose('pessoal')
    setPurposeDesc('')
    setErrors({})
    mutation.reset()
    onClose()
  }

  const accountBlocked = accountStatus && !accountStatus.has_updated_account

  return (
    <Modal open={open} onClose={handleClose} title={`Solicitar Crédito — ${client.full_name}`} size="md">
      {/* Loading */}
      {loadingStatus && (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0097A9]" />
        </div>
      )}

      {/* Account not updated — blocking */}
      {!loadingStatus && accountBlocked && (
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Conta do cliente não actualizada</p>
              <p className="text-xs text-amber-700 mt-1">
                Não é possível solicitar crédito. O cliente precisa de ter os documentos de identidade
                e da entidade patronal verificados antes de pedir crédito.
              </p>
            </div>
          </div>
          <div className="space-y-1.5 text-sm">
            {accountStatus!.missing_identity && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Documento de identidade verificado em falta
              </div>
            )}
            {accountStatus!.missing_employer && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Documento da entidade patronal verificado em falta
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={handleClose}>Fechar</Button>
          </div>
        </div>
      )}

      {/* Normal flow */}
      {!loadingStatus && !accountBlocked && (success ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <div>
            <p className="text-lg font-semibold text-gray-800">Pedido submetido com sucesso</p>
            <p className="mt-1 text-sm text-gray-500">
              O pedido de crédito foi registado e aguarda atribuição a um analista.
            </p>
          </div>
          <Button onClick={handleClose}>Fechar</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Verified employer info */}
          {(client.employer || client.monthly_income) && (
            <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Dados verificados na conta do cliente
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-teal-600">
                {client.employer && <span>Empregador: <strong>{client.employer}</strong></span>}
                {client.job_title && <span>Cargo: <strong>{client.job_title}</strong></span>}
                {client.employment_type && <span>Situação: <strong>{client.employment_type}</strong></span>}
                {client.monthly_income != null && client.monthly_income > 0 && (
                  <span>Rendimento: <strong>{formatCurrency(client.monthly_income)}</strong></span>
                )}
              </div>
            </div>
          )}

          {/* Product */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Produto de Crédito *</label>
            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-[#0097A9] focus:outline-none"
            >
              <option value="">Selecione um produto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.base_interest_rate}% a.a.
                </option>
              ))}
            </select>
            {errors.product && <p className="text-xs text-red-600">{errors.product}</p>}
          </div>

          {/* Product constraints hint */}
          {selectedProduct && (
            <div className="rounded-md bg-[#0097A9]/5 border border-[#0097A9]/20 px-3 py-2 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
              <span>Montante: <strong>{formatCurrency(selectedProduct.min_amount)} – {formatCurrency(selectedProduct.max_amount)}</strong></span>
              <span>Prazo: <strong>{selectedProduct.min_term_months} – {selectedProduct.max_term_months} meses</strong></span>
              <span>Taxa: <strong>{selectedProduct.base_interest_rate}% a.a.</strong></span>
            </div>
          )}

          {/* Amount + Term */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Montante (AOA) *"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              error={errors.amount}
              placeholder="500000"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Prazo *</label>
              <select
                value={termMonths}
                onChange={e => setTermMonths(e.target.value)}
                className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-[#0097A9] focus:outline-none"
              >
                <option value="">Selecione...</option>
                {termOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.term && <p className="text-xs text-red-600">{errors.term}</p>}
            </div>
          </div>

          {/* Purpose */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Finalidade *</label>
            <select
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-[#0097A9] focus:outline-none"
            >
              {PURPOSE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.purpose && <p className="text-xs text-red-600">{errors.purpose}</p>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Descrição <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={purposeDesc}
              onChange={e => setPurposeDesc(e.target.value)}
              rows={2}
              placeholder="Descreva brevemente o motivo do pedido..."
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#0097A9] focus:outline-none resize-none"
            />
          </div>

          {/* API error */}
          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {(() => {
                const msg = (mutation.error as any)?.response?.data?.message
                return Array.isArray(msg) ? msg.join('. ') : (msg || 'Erro ao submeter o pedido. Tente novamente.')
              })()}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" loading={mutation.isPending}>
              <CreditCard className="h-4 w-4" />
              Submeter Pedido
            </Button>
          </div>
        </form>
      ))}
    </Modal>
  )
}
