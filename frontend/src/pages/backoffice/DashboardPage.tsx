import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Users, CreditCard, CheckCircle, TrendingUp,
} from 'lucide-react'
import { dashboardService } from '../../services/dashboard.service'
import { StatCard } from '../../components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { usePermissions } from '../../hooks/usePermissions'

// Paleta neutra: teal do banco + cinzas
const CHART_BARS = { submitted: '#9CA3AF', approved: '#0097A9', rejected: '#374151' }
const RISK_COLORS = ['#0097A9', '#9CA3AF', '#374151']

export default function DashboardPage() {
  const {
    canViewDashboardSummary,
    canViewCreditStats,
    canViewCreditTrend,
    canViewRiskDistribution,
    canViewRecentActivity,
  } = usePermissions()

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardService.getSummary,
    refetchInterval: 60000,
    enabled: canViewDashboardSummary(),
  })

  const { data: trend } = useQuery({
    queryKey: ['credit-trend'],
    queryFn: () => dashboardService.getCreditTrend(6),
    enabled: canViewCreditTrend(),
  })

  const { data: riskDist } = useQuery({
    queryKey: ['risk-distribution'],
    queryFn: dashboardService.getRiskDistribution,
    enabled: canViewRiskDistribution(),
  })

  const { data: activity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => dashboardService.getRecentActivity(8),
    enabled: canViewRecentActivity(),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-7 w-7 animate-spin text-[#0097A9]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">A carregar indicadores...</p>
        </div>
      </div>
    )
  }

  const creditStats = summary?.credits || {}
  const clientStats = summary?.clients || {}

  return (
    <div className="space-y-6">
      {/* KPI Cards — uma linha com os 4 indicadores principais */}
      {canViewCreditStats() && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            title="Total de Clientes"
            value={clientStats.total ?? 0}
            subtitle={`${clientStats.eligible ?? 0} elegíveis`}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Pedidos de Crédito"
            value={creditStats.total ?? 0}
            subtitle={`${creditStats.pending ?? 0} em análise`}
            icon={<CreditCard className="h-5 w-5" />}
          />
          <StatCard
            title="Taxa de Aprovação"
            value={`${creditStats.approval_rate ?? 0}%`}
            subtitle={`${creditStats.by_status?.aprovado ?? 0} aprovados`}
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <StatCard
            title="Volume Aprovado"
            value={formatCurrency(creditStats.total_approved ?? 0)}
            subtitle="Total desembolsado"
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {canViewCreditTrend() && (
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Evolução de Pedidos (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={trend || []} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E5E7EB', boxShadow: 'none' }}
                    cursor={{ fill: '#F9FAFB' }}
                  />
                  <Bar dataKey="submitted" name="Submetidos" fill={CHART_BARS.submitted} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="approved"  name="Aprovados"  fill={CHART_BARS.approved}  radius={[3, 3, 0, 0]} />
                  <Bar dataKey="rejected"  name="Rejeitados" fill={CHART_BARS.rejected}  radius={[3, 3, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#6B7280' }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {canViewRiskDistribution() && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={riskDist || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="label"
                  >
                    {(riskDist || []).map((_: any, index: number) => (
                      <Cell key={index} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E5E7EB', boxShadow: 'none' }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#6B7280' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actividade Recente */}
      {canViewRecentActivity() && (
        <Card>
          <CardHeader>
            <CardTitle>Actividade Recente</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Acção</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Entidade</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(activity || []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-gray-400">
                      Sem actividade recente
                    </td>
                  </tr>
                )}
                {(activity || []).map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-800">{actionLabel(log.action)}</td>
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs">{log.entity_type} · {log.entity_id?.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-right text-xs text-gray-400">{formatDateTime(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    credit_request_created:    'Pedido de crdito criado',
    credit_request_cancelled:  'Pedido de crdito cancelado',
    credit_decision_made:      'Deciso de crdito registada',
    credit_analyst_assigned:   'Analista atribudo ao pedido',
    document_upload:           'Documento enviado',
    document_validation:       'Documento validado',
    document_delete:           'Documento removido',
  }
  return labels[action] || action.replace(/_/g, ' ')
}

