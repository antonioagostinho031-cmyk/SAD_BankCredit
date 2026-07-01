﻿import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, PlayCircle, UserCheck, ExternalLink } from 'lucide-react'
import { creditService } from '../../services/credit.service'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Modal } from '../../components/ui/modal'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getScoreColor } from '../../lib/utils'
import type { CreditRequest } from '../../types'
import CreditAnalysisModal from '../../components/backoffice/CreditAnalysisModal'
import CreditDecisionModal from '../../components/backoffice/CreditDecisionModal'
import { usePermissions } from '../../hooks/usePermissions'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'submetido', label: 'Submetidos' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'aprovado', label: 'Aprovados' },
  { value: 'aprovado_condicional', label: 'Aprovados Condicional' },
  { value: 'rejeitado', label: 'Rejeitados' },
]

const PURPOSE_LABELS: Record<string, string> = {
  habitacao: 'Habitação',
  automovel: 'Automóvel',
  educacao: 'Educação',
  saude: 'Saude',
  consolidacao: 'Consolidação',
  negocio: 'Negócio',
  outros: 'Outros',
}

export default function CreditoPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { canAnalyseCreditRequest, canMakeCreditDecision, canCreateCreditRequest } = usePermissions()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedCredit, setSelectedCredit] = useState<CreditRequest | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showDecision, setShowDecision] = useState(false)

  const { data: credits = [], isLoading } = useQuery({
    queryKey: ['credits', statusFilter],
    queryFn: () => creditService.getAll(statusFilter ? { status: statusFilter } : {}),
  })

  const analyseMutation = useMutation({
    mutationFn: (id: string) => creditService.analyse(id),
    onSuccess: (data) => {
      setSelectedCredit({ ...selectedCredit!, analysis: data } as any)
      setShowAnalysis(true)
      queryClient.invalidateQueries({ queryKey: ['credits'] })
    },
  })

  const filtered = credits.filter((c: any) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      c.clients?.full_name?.toLowerCase().includes(s) ||
      c.clients?.bi_number?.toLowerCase().includes(s) ||
      c.id.toLowerCase().includes(s)
    )
  })

  const handleAnalyse = (credit: CreditRequest) => {
    setSelectedCredit(credit)
    analyseMutation.mutate(credit.id)
  }

  const handleDecision = (credit: CreditRequest) => {
    setSelectedCredit(credit)
    setShowDecision(true)
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar pedidos..."
            className="h-9 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-[#0097A9] focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>
            Pedidos de Crédito
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
                  <TableHead>Montante</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Finalidade</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prestação</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-gray-400">
                      Nenhum pedido encontrado
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((credit: any) => (
                  <TableRow key={credit.id}>
                    <TableCell>
                      <p className="font-medium text-gray-900">{credit.clients?.full_name || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{formatCurrency(credit.requested_amount)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{credit.term_months} meses</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{PURPOSE_LABELS[credit.purpose] || credit.purpose}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(credit.status)}`}>
                        {getStatusLabel(credit.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {credit.monthly_payment ? formatCurrency(credit.monthly_payment) : '-'}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">{formatDate(credit.created_at)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/backoffice/credito/${credit.id}`)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          title="Ver detalhe"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        {canAnalyseCreditRequest() && (credit.status === 'submetido' || credit.status === 'em_analise') && (
                          <button
                            onClick={() => handleAnalyse(credit)}
                            disabled={analyseMutation.isPending}
                            className="rounded-md p-1.5 text-[#0097A9] hover:bg-[#0097A9]/10 transition-colors disabled:opacity-40"
                            title="Analisar pedido"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </button>
                        )}
                        {canMakeCreditDecision() && credit.status === 'em_analise' && (
                          <button
                            onClick={() => handleDecision(credit)}
                            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            title="Registar deciso"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Analysis Modal */}
      {selectedCredit && showAnalysis && (
        <CreditAnalysisModal
          creditId={selectedCredit.id}
          analysisResult={(selectedCredit as any).analysis}
          open={showAnalysis}
          onClose={() => setShowAnalysis(false)}
          onDecision={() => { setShowAnalysis(false); setShowDecision(true) }}
        />
      )}

      {/* Decision Modal */}
      {selectedCredit && (
        <CreditDecisionModal
          credit={selectedCredit}
          open={showDecision}
          onClose={() => setShowDecision(false)}
          onSuccess={() => {
            setShowDecision(false)
            setSelectedCredit(null)
            queryClient.invalidateQueries({ queryKey: ['credits'] })
          }}
        />
      )}
    </div>
  )
}

