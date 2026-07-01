import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { creditService } from '../../services/credit.service'
import api from '../../services/api'
import { formatCurrency } from '../../lib/utils'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Calculator, TrendingDown, AlertCircle } from 'lucide-react'

interface Product {
  id: string
  name: string
  code: string
  category: string
  min_amount: number
  max_amount: number
  min_term_months: number
  max_term_months: number
  base_interest_rate: number
  opening_fee_percent: number
  opening_fee_fixed: number
  management_fee_annual: number
  early_payment_fee: number
  requires_guarantor: boolean
  requires_collateral: boolean
  min_income: number
}

const schema = z.object({
  amount: z.coerce.number().min(1, 'Montante obrigatório'),
  term_months: z.coerce.number().min(1),
})
type FormData = z.infer<typeof schema>

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
  { value: 300, label: '25 anos (300 meses)' },
  { value: 360, label: '30 anos (360 meses)' },
  { value: 420, label: '35 anos (420 meses)' },
]

export function SimulacaoCredito() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [productError, setProductError] = useState('')
  const [simError, setSimError] = useState('')

  const selectedProduct = products.find(p => p.id === selectedProductId) ?? null

  const termOptions = selectedProduct
    ? ALL_TERM_OPTIONS.filter(o => o.value >= selectedProduct.min_term_months && o.value <= selectedProduct.max_term_months)
    : ALL_TERM_OPTIONS

  useEffect(() => {
    api.get('/products', { params: { active: 'true' } })
      .then(res => setProducts(res.data))
      .catch(console.error)
  }, [])

  const { register, handleSubmit, formState: { errors }, setError, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 500000, term_months: 12 },
  })

  useEffect(() => {
    if (selectedProduct && termOptions.length > 0) {
      setValue('term_months', termOptions[0].value)
      setValue('amount', selectedProduct.min_amount)
    }
  }, [selectedProductId])

  const onSubmit = async (data: FormData) => {
    setProductError('')

    if (!selectedProduct) {
      setProductError('Selecione um produto de crédito para simular.')
      return
    }

    if (data.amount < selectedProduct.min_amount) {
      setError('amount', { message: `Mínimo para este produto: ${formatCurrency(selectedProduct.min_amount)}` })
      return
    }
    if (data.amount > selectedProduct.max_amount) {
      setError('amount', { message: `Máximo para este produto: ${formatCurrency(selectedProduct.max_amount)}` })
      return
    }

    setLoading(true)
    setSimError('')
    try {
      const res = await creditService.simulate({
        amount: data.amount,
        term_months: data.term_months,
        interest_rate: selectedProduct.base_interest_rate,
      })
      setResult({ ...res, product: selectedProduct })
      setShowTable(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setSimError(Array.isArray(msg) ? msg.join('. ') : (msg || 'Erro ao calcular a simulação. Tente novamente.'))
    } finally {
      setLoading(false)
    }
  }

  const openingFee = result?.product
    ? (result.amount * (result.product.opening_fee_percent ?? 0) / 100) + (result.product.opening_fee_fixed ?? 0)
    : 0
  const firstYearMgmtFee = result?.product
    ? result.amount * (result.product.management_fee_annual ?? 0) / 100
    : 0

  return (
    <div className="space-y-5">
      {/* Product selector */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Produto de Crédito</label>
          <select
            value={selectedProductId}
            onChange={e => { setSelectedProductId(e.target.value); setResult(null); setProductError('') }}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-[#0097A9] focus:outline-none"
          >
            <option value="">Selecione um produto de crédito...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — Taxa: {p.base_interest_rate}% a.a.
              </option>
            ))}
          </select>
          {productError && (
            <p className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              {productError}
            </p>
          )}
        </div>

        {selectedProduct && (
          <div className="grid grid-cols-2 gap-3 rounded-md bg-[#0097A9]/5 border border-[#0097A9]/20 p-3 sm:grid-cols-3 lg:grid-cols-5">
            <InfoPill label="Taxa Base" value={`${selectedProduct.base_interest_rate}% a.a.`} accent />
            <InfoPill
              label="Montante"
              value={`${formatCurrency(selectedProduct.min_amount)} – ${formatCurrency(selectedProduct.max_amount)}`}
            />
            <InfoPill
              label="Prazo"
              value={`${selectedProduct.min_term_months} – ${selectedProduct.max_term_months} meses`}
            />
            <InfoPill
              label="Comissão Abertura"
              value={
                selectedProduct.opening_fee_percent > 0
                  ? `${selectedProduct.opening_fee_percent}%${selectedProduct.opening_fee_fixed > 0 ? ` + ${formatCurrency(selectedProduct.opening_fee_fixed)}` : ''}`
                  : selectedProduct.opening_fee_fixed > 0
                  ? formatCurrency(selectedProduct.opening_fee_fixed)
                  : 'Isenta'
              }
            />
            <InfoPill
              label="Gestão Anual"
              value={selectedProduct.management_fee_annual > 0 ? `${selectedProduct.management_fee_annual}% a.a.` : 'Isenta'}
            />
            {(selectedProduct.requires_guarantor || selectedProduct.requires_collateral || selectedProduct.min_income > 0) && (
              <div className="col-span-full flex flex-wrap gap-2 pt-1 border-t border-[#0097A9]/10 mt-1">
                {selectedProduct.requires_guarantor && (
                  <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">Requer fiador</span>
                )}
                {selectedProduct.requires_collateral && (
                  <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">Requer garantia</span>
                )}
                {selectedProduct.min_income > 0 && (
                  <span className="text-xs rounded-full bg-blue-100 text-blue-700 px-2 py-0.5">
                    Rendimento mínimo: {formatCurrency(selectedProduct.min_income)}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Simulation form */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-3 gap-4 items-end">
        <Input
          label={
            selectedProduct
              ? `Montante — ${formatCurrency(selectedProduct.min_amount)} a ${formatCurrency(selectedProduct.max_amount)}`
              : 'Montante (AOA)'
          }
          type="number"
          {...register('amount')}
          error={errors.amount?.message}
          placeholder="500000"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Prazo</label>
          <select
            {...register('term_months')}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-[#0097A9] focus:outline-none"
          >
            {termOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <Button type="submit" loading={loading}>
          <Calculator className="h-4 w-4" />
          Simular
        </Button>
      </form>

      {simError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {simError}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <ResultCard label="Montante Solicitado" value={formatCurrency(result.amount)} highlight />
            <ResultCard label="Prestação Mensal" value={formatCurrency(result.monthly_payment)} highlight />
            <ResultCard label="Total (capital + juros)" value={formatCurrency(result.total_amount)} />
            <ResultCard label="Total de Juros" value={formatCurrency(result.total_interest)} warning />
          </div>

          {result.product && (openingFee > 0 || firstYearMgmtFee > 0) && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                Custos adicionais — {result.product.name}
              </p>
              <div className="flex flex-wrap gap-5 text-sm text-blue-800">
                {openingFee > 0 && (
                  <span>
                    Comissão de abertura: <strong>{formatCurrency(openingFee)}</strong>
                  </span>
                )}
                {firstYearMgmtFee > 0 && (
                  <span>
                    Gestão (1.º ano): <strong>{formatCurrency(firstYearMgmtFee)}</strong>
                  </span>
                )}
                <span className="text-blue-600 font-medium">
                  Custo total estimado: <strong>{formatCurrency(result.total_amount + openingFee + firstYearMgmtFee)}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <TrendingDown className="h-4 w-4" />
              Taxa de juro anual: <strong>{result.interest_rate}%</strong>
              <span className="text-gray-400">({(result.interest_rate / 12).toFixed(2)}% mensal)</span>
              {result.product && (
                <span className="text-[#0097A9] text-xs ml-1">— {result.product.name}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowTable(!showTable)}
              className="text-xs text-[#0097A9] underline hover:no-underline"
            >
              {showTable ? 'Ocultar' : 'Ver'} tabela de amortização
            </button>
          </div>

          {showTable && result.amortization_table?.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Mês</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Prestação</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Capital</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Juros</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {result.amortization_table.map((row: any) => (
                    <tr key={row.month} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="px-3 py-2 text-gray-600">{row.month}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(row.payment)}</td>
                      <td className="px-3 py-2 text-right text-[#0097A9]">{formatCurrency(row.principal)}</td>
                      <td className="px-3 py-2 text-right text-red-500">{formatCurrency(row.interest)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">{formatCurrency(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoPill({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${accent ? 'text-[#0097A9]' : 'text-gray-800'}`}>{value}</span>
    </div>
  )
}

function ResultCard({ label, value, highlight = false, warning = false }: {
  label: string; value: string; highlight?: boolean; warning?: boolean
}) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? 'border-gray-200 bg-gray-50' : warning ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${highlight ? 'text-gray-700' : warning ? 'text-orange-700' : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  )
}
