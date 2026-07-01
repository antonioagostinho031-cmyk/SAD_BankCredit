import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Search, FileText, AlertCircle, CheckCircle, Info, ChevronRight } from 'lucide-react'
import { productsService } from '../../services/products.service'
import { formatCurrency } from '../../lib/utils'
import { PortalLayout } from '../../components/portal/PortalLayout'

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
  active: boolean
}

const categoryLabels: Record<string, string> = {
  pessoal: 'Pessoal',
  habitacao: 'Habitação',
  automovel: 'Automóvel',
  consolidacao: 'Consolidado',
  empresarial: 'Empresarial',
}

const categoryTabs: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'pessoal', label: 'Pessoal' },
  { key: 'habitacao', label: 'Habitação' },
  { key: 'automovel', label: 'Automóvel' },
  { key: 'consolidacao', label: 'Consolidado' },
  { key: 'empresarial', label: 'Empresarial' },
]

export default function PortalCreditoPage() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['portal-products'],
    queryFn: () => productsService.getAll({ active: true }),
  })

  const filteredProducts = (products as CreditProduct[]).filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    return matchesCategory && matchesSearch && p.active
  })

  return (
    <PortalLayout>
      <div className="space-y-5">

        {/* ── Cabeçalho ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Produtos de Crédito</h1>
              <p className="text-sm text-gray-500">Consulte as nossas soluções de financiamento</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/portal/credito/pedidos')}
            className="bg-[#0097A9] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#007A8A] transition-colors"
          >
            Os Meus Pedidos
          </button>
        </div>

        {/* ── Alerta elegibilidade ───────────────────────────────── */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
          <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">
            Com base no seu perfil, está elegível para solicitar até{' '}
            <strong>AOA 3.000.000,00</strong> em crédito pessoal.
          </p>
        </div>

        {/* ── Filtros ────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0097A9] focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {categoryTabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-[#0097A9] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tabela de Produtos ─────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0097A9] mx-auto mb-3" />
                <p className="text-sm text-gray-400">A carregar produtos...</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-14 text-center">
              <AlertCircle className="h-9 w-9 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhum produto encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Produto
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Categoria
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Montante (AOA)
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Prazo
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      TAN
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Acções
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/60 transition-colors">

                      {/* Produto */}
                      <td className="px-5 py-4 max-w-xs">
                        <p className="font-semibold text-gray-900 leading-tight">{product.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{product.code}</p>
                        {product.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{product.description}</p>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {categoryLabels[product.category] ?? product.category}
                        </span>
                      </td>

                      {/* Montante */}
                      <td className="px-4 py-4 text-right tabular-nums">
                        <p className="text-gray-900 font-medium">{formatCurrency(product.min_amount)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">até {formatCurrency(product.max_amount)}</p>
                      </td>

                      {/* Prazo */}
                      <td className="px-4 py-4 text-center">
                        <p className="text-gray-900">
                          {product.min_term_months}&nbsp;–&nbsp;{product.max_term_months}
                        </p>
                        <p className="text-xs text-gray-400">meses</p>
                      </td>

                      {/* TAN */}
                      <td className="px-4 py-4 text-center">
                        <p className="text-lg font-bold text-[#0097A9] leading-tight">
                          {product.base_interest_rate.toFixed(2)}%
                        </p>
                        <p className="text-xs text-gray-400">
                          {product.min_interest_rate.toFixed(0)}%&nbsp;–&nbsp;{product.max_interest_rate.toFixed(0)}%
                        </p>
                      </td>

                      {/* Acções */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/portal/credito/fti/${product.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 rounded text-xs font-medium hover:bg-gray-50 transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            FTI
                          </button>
                          <button
                            onClick={() => navigate(`/portal/credito/solicitar/${product.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0097A9] text-white rounded text-xs font-semibold hover:bg-[#007A8A] transition-colors"
                          >
                            Solicitar
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé da tabela */}
          {!isLoading && filteredProducts.length > 0 && (
            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} disponível{filteredProducts.length !== 1 ? 'is' : ''}
              </p>
            </div>
          )}
        </div>

        {/* ── Ajuda ─────────────────────────────────────────────── */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Precisa de ajuda? Contacte-nos pelo{' '}
            <strong>+244 933 168 400</strong> ou{' '}
            <strong>credito@atlantico.ao</strong>
          </p>
        </div>

      </div>
    </PortalLayout>
  )
}
