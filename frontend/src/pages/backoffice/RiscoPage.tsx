import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ShieldAlert, ShieldCheck, AlertTriangle, Eye } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/table'
import { formatCurrency, formatDate, getRiskColor, getRiskLabel } from '../../lib/utils'
import RiskDetailModal from '../../components/backoffice/RiskDetailModal'
import api from '../../services/api'

export default function RiscoPage() {
  const [search, setSearch]           = useState('')
  const [riskFilter, setRiskFilter]   = useState('')
  const [selected, setSelected]       = useState<any>(null)

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['risk-assessments', riskFilter],
    queryFn: async () => {
      const { data } = await api.get('/risk/client/all', {
        params: riskFilter ? { risk_level: riskFilter } : {},
      })
      return data
    },
  })

  const { data: distribution } = useQuery({
    queryKey: ['risk-distribution-page'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/risk-distribution')
      return data
    },
  })

  // risk_factors pode chegar como JSONB string — normalizar para array
  const normalise = (r: any) => ({
    ...r,
    risk_factors:       Array.isArray(r.risk_factors)       ? r.risk_factors       : (typeof r.risk_factors       === 'string' ? JSON.parse(r.risk_factors)       : []),
    mitigating_factors: Array.isArray(r.mitigating_factors) ? r.mitigating_factors : (typeof r.mitigating_factors === 'string' ? JSON.parse(r.mitigating_factors) : []),
  })

  const filtered = assessments.map(normalise).filter((r: any) => {
    if (!search) return true
    const s    = search.toLowerCase()
    const name = r.clients?.full_name?.toLowerCase() ?? ''
    return name.includes(s) || r.client_id?.toLowerCase().includes(s)
  })

  const riskLevelCards = [
    { level: 'baixo', label: 'Baixo Risco',  icon: <ShieldCheck  className="h-5 w-5" />, color: 'text-[#0097A9]', bg: 'bg-[#0097A9]/5 border-[#0097A9]/20' },
    { level: 'medio', label: 'Médio Risco',  icon: <ShieldAlert  className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { level: 'alto',  label: 'Alto Risco',   icon: <AlertTriangle className="h-5 w-5" />, color: 'text-red-600',  bg: 'bg-red-50 border-red-200' },
  ]

  return (
    <div className="space-y-5">

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-4">
        {riskLevelCards.map((card) => {
          const count = distribution?.find((d: any) => d.level === card.level)?.count || 0
          return (
            <div
              key={card.level}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${card.bg} ${riskFilter === card.level ? 'ring-2 ring-offset-1 ring-current' : ''}`}
              onClick={() => setRiskFilter(riskFilter === card.level ? '' : card.level)}
            >
              <div className="flex items-center gap-3">
                <span className={card.color}>{card.icon}</span>
                <div>
                  <p className={`text-2xl font-bold ${card.color}`}>{count}</p>
                  <p className="text-xs text-gray-600">{card.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Barra de pesquisa */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por cliente..."
            className="h-9 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm focus:border-[#0097A9] focus:outline-none"
          />
        </div>
        {riskFilter && (
          <button
            onClick={() => setRiskFilter('')}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>
            Avaliações de Risco
            <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <svg className="h-6 w-6 animate-spin text-[#0097A9]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Nível de Risco</TableHead>
                  <TableHead>Pontuação</TableHead>
                  <TableHead>Endividamento</TableHead>
                  <TableHead>Cap. Pagamento</TableHead>
                  <TableHead>Montante Máx.</TableHead>
                  <TableHead>Factores</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-gray-400">
                      {assessments.length === 0
                        ? 'Nenhuma avaliacao de risco disponivel. Execute analises de credito para gerar dados.'
                        : 'Nenhuma avaliacao encontrada com os filtros aplicados.'}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r: any) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelected(r)}
                  >
                    <TableCell>
                      <span className="text-sm font-medium text-gray-900">
                        {r.clients?.full_name ?? '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold text-sm ${getRiskColor(r.risk_level)}`}>
                        {getRiskLabel(r.risk_level)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 rounded-full bg-gray-200">
                          <div
                            className={`h-1.5 rounded-full ${r.risk_score <= 30 ? 'bg-[#0097A9]' : r.risk_score <= 60 ? 'bg-amber-400' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(r.risk_score, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{r.risk_score}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${r.debt_ratio > 50 ? 'text-red-600' : r.debt_ratio > 35 ? 'text-amber-600' : 'text-[#0097A9]'}`}>
                        {r.debt_ratio?.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatCurrency(r.payment_capacity)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{formatCurrency(r.max_recommended_amount)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">
                        {r.risk_factors?.length ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">{formatDate(r.assessed_at)}</span>
                    </TableCell>
                    <TableCell onClick={(e) => { e.stopPropagation(); setSelected(r) }}>
                      <button className="rounded-md p-1.5 text-gray-400 hover:bg-[#0097A9]/10 hover:text-[#0097A9] transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhe */}
      {selected && (
        <RiskDetailModal
          assessment={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
