import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Users, FileText, ShieldCheck, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { formatCurrency } from '../../lib/utils'
import api from '../../services/api'

type ReportType = 'credit' | 'clients' | 'risk' | 'documents'

export default function RelatoriosPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('credit')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['report', activeReport, startDate, endDate, statusFilter],
    queryFn: async () => {
      const params: any = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      if (statusFilter) params.status = statusFilter

      const { data } = await api.get(`/reports/${activeReport === 'clients' ? 'clients' : activeReport}`, { params })
      return data
    },
  })

  const REPORT_TABS = [
    { key: 'credit' as ReportType, label: 'Credito', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'clients' as ReportType, label: 'Clientes', icon: <Users className="h-4 w-4" /> },
    { key: 'risk' as ReportType, label: 'Risco', icon: <ShieldCheck className="h-4 w-4" /> },
    { key: 'documents' as ReportType, label: 'Documentos', icon: <FileText className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-5">
      {/* Report Type Tabs */}
      <div className="flex gap-2">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveReport(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeReport === tab.key
                ? 'bg-[#0097A9] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Data Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 rounded-md border border-gray-300 px-3 text-sm focus:border-[#0097A9] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Data Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 rounded-md border border-gray-300 px-3 text-sm focus:border-[#0097A9] focus:outline-none"
              />
            </div>
            {activeReport === 'credit' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Estado</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-[#0097A9] focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="rejeitado">Rejeitado</option>
                  <option value="em_analise">Em Analise</option>
                </select>
              </div>
            )}
            <Button onClick={() => refetch()} variant="secondary">
              Aplicar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <svg className="h-6 w-6 animate-spin text-[#0097A9]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : reportData && (
        <div className="space-y-5">
          {/* Summary Cards */}
          {activeReport === 'credit' && reportData.summary && (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <SummaryCard label="Total de Pedidos" value={reportData.summary.total} />
              <SummaryCard label="Volume Solicitado" value={formatCurrency(reportData.summary.total_requested)} />
              <SummaryCard label="Volume Aprovado" value={formatCurrency(reportData.summary.total_approved)} />
              <SummaryCard label="Score Medio" value={`${reportData.summary.average_score}/100`} />
            </div>
          )}

          {activeReport === 'clients' && reportData.summary && (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              <SummaryCard label="Total de Clientes" value={reportData.summary.total} />
              <SummaryCard label="Elegiveis para Credito" value={reportData.summary.eligible} />
              <SummaryCard label="Registos Completos" value={reportData.summary.by_status?.aprovado || 0} />
            </div>
          )}

          {/* Data Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardTitle>Dados do Relatorio ({reportData.data?.length || 0} registos)</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {getColumns(activeReport).map((col) => (
                        <th key={col.key} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.data || []).map((row: any, i: number) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-gray-50/50">
                        {getColumns(activeReport).map((col) => (
                          <td key={col.key} className="px-4 py-3 text-gray-700">
                            {col.render ? col.render(row[col.key], row) : (row[col.key] || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1.5 text-xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function getColumns(type: ReportType) {
  const cols: any = {
    credit: [
      { key: 'client', label: 'Cliente' },
      { key: 'requested_amount', label: 'Montante', render: (v: number) => formatCurrency(v) },
      { key: 'term_months', label: 'Prazo', render: (v: number) => `${v} meses` },
      { key: 'status', label: 'Estado' },
      { key: 'purpose', label: 'Finalidade' },
      { key: 'score', label: 'Score', render: (v: number) => v ? `${v}/100` : '-' },
    ],
    clients: [
      { key: 'name', label: 'Nome' },
      { key: 'bi', label: 'BI' },
      { key: 'income', label: 'Rendimento', render: (v: number) => formatCurrency(v) },
      { key: 'employer', label: 'Entidade Patronal' },
      { key: 'status', label: 'Estado' },
      { key: 'eligible', label: 'Elegivel', render: (v: boolean) => v ? 'Sim' : 'Nao' },
    ],
    risk: [
      { key: 'client', label: 'Cliente' },
      { key: 'risk_level', label: 'Nível de Risco' },
      { key: 'risk_score', label: 'Pontuação' },
      { key: 'debt_ratio', label: 'Endividamento', render: (v: number) => `${v}%` },
      { key: 'payment_capacity', label: 'Capacidade Pag.', render: (v: number) => formatCurrency(v) },
    ],
    documents: [
      { key: 'client', label: 'Cliente' },
      { key: 'type', label: 'Tipo' },
      { key: 'status', label: 'Estado' },
      { key: 'confidence', label: 'Confiança IA', render: (v: number) => v ? `${v}%` : '-' },
    ],
  }
  return cols[type] || []
}


