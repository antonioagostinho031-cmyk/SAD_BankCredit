import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Modal } from '../ui/modal'
import { formatCurrency } from '../../lib/utils'
import api from '../../services/api'

interface ClientFinancialProfileProps {
  clientId: string
  clientName: string
  open: boolean
  onClose: () => void
}

export default function ClientFinancialProfile({ clientId, clientName, open, onClose }: ClientFinancialProfileProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['client-financial-metrics', clientId],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${clientId}/financial-metrics`)
      return data
    },
    enabled: open && !!clientId,
  })

  const { data: transactions } = useQuery({
    queryKey: ['client-transactions', clientId],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${clientId}/transactions?months=6`)
      return data
    },
    enabled: open && !!clientId,
  })

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title={`Perfil Financeiro - ${clientName}`} size="xl">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <svg className="h-8 w-8 animate-spin text-[#0097A9]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-500">A carregar mtricas financeiras...</p>
            </div>
          </div>
        ) : metrics ? (
          <>
            {/* Status de Elegibilidade */}
            <div className={`rounded-lg border-2 p-4 ${metrics.is_eligible ? 'border-[#0097A9]/20 bg-[#0097A9]/5' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${metrics.is_eligible ? 'text-gray-900' : 'text-red-900'}`}>
                    {metrics.is_eligible ? 'Cliente Elegível para Crédito' : 'Cliente No Elegível para Crédito'}
                  </h3>
                  <p className={`mt-1 text-sm ${metrics.is_eligible ? 'text-[#0097A9]' : 'text-red-700'}`}>
                    Score de Crédito: <strong>{metrics.credit_score}/100</strong>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-600 uppercase">Montante Mximo</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.max_credit_amount)}</p>
                  <p className="text-xs text-gray-600 mt-1">Prazo: {metrics.recommended_term} meses</p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                {metrics.eligibility_factors.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#0097A9] uppercase mb-2">Factores Positivos</p>
                    <ul className="space-y-1">
                      {metrics.eligibility_factors.map((factor: string, i: number) => (
                        <li key={i} className="text-xs text-[#0097A9]">• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {metrics.risk_factors.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-800 uppercase mb-2">Factores de Risco</p>
                    <ul className="space-y-1">
                      {metrics.risk_factors.map((factor: string, i: number) => (
                        <li key={i} className="text-xs text-red-700">• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Tabela de Rendimentos e Saldos */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase">Rendimentos e Saldos</h3>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mtrica</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Valor</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Mdia 6M</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Rendimento Mensal</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(metrics.monthly_income)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(metrics.average_income_6m)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          metrics.income_stability >= 70 ? 'bg-[#0097A9]/10 text-[#0097A9]' : 
                          metrics.income_stability >= 50 ? 'bg-gray-100 text-gray-600' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {metrics.income_stability.toFixed(0)}% Estvel
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Saldo em Conta</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(metrics.current_balance)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(metrics.average_balance_6m)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-600">
                          {metrics.current_balance >= metrics.average_balance_6m ? 'Positivo' : 'Ateno'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Total Créditos (6M)</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#0097A9]">{formatCurrency(metrics.total_credits_6m)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(metrics.total_credits_6m / 6)}/ms</td>
                      <td className="px-4 py-3 text-center text-gray-500">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50 bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Total Débitos (6M)</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(metrics.total_debits_6m)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(metrics.total_debits_6m / 6)}/ms</td>
                      <td className="px-4 py-3 text-center text-gray-500">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela de Capacidade de Pagamento e Endividamento */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase">Capacidade de Pagamento</h3>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Indicador</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Valor</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Avaliação</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Observao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Rendimento Disponvel</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(metrics.disposable_income)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-600">
                          Adequado
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">Aps crditos ativos</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Capacidade de Pagamento (35%)</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(metrics.payment_capacity)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-600">
                          Normal
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">Prestao mxima recomendada</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Taxa de Endividamento</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{metrics.debt_ratio.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          metrics.debt_ratio <= 35 ? 'bg-[#0097A9]/10 text-[#0097A9]' : 
                          metrics.debt_ratio <= 50 ? 'bg-gray-100 text-gray-600' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {metrics.debt_ratio <= 35 ? 'Baixo' : metrics.debt_ratio <= 50 ? 'Mdio' : 'Alto'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {metrics.debt_ratio <= 35 ? 'Dentro do limite aceitvel' : 
                         metrics.debt_ratio <= 50 ? 'Requer ateno' : 
                         'Acima do recomendado'}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Prestao Mxima Sugerida</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(metrics.max_installment)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-[#0097A9]/10 text-[#0097A9]">
                          Calculado
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">Baseado em {metrics.recommended_term} meses</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela de Histórico de Créditos */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase">Histórico de Crédito</h3>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoria</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Quantidade</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Percentagem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Total de Pedidos</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">{metrics.total_credits}</td>
                      <td className="px-4 py-3 text-right text-gray-600">100%</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">Créditos Ativos</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-[#0097A9]/10 text-[#0097A9]">
                          {metrics.active_credits}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {metrics.total_credits > 0 ? ((metrics.active_credits / metrics.total_credits) * 100).toFixed(0) : 0}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">Créditos Concluídos</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-600">
                          {metrics.completed_credits}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {metrics.total_credits > 0 ? ((metrics.completed_credits / metrics.total_credits) * 100).toFixed(0) : 0}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">Créditos Rejeitados</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                          {metrics.rejected_credits}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {metrics.total_credits > 0 ? ((metrics.rejected_credits / metrics.total_credits) * 100).toFixed(0) : 0}%
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 bg-red-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Incumprimentos</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          metrics.default_count > 0 ? 'bg-red-200 text-red-900' : 'bg-[#0097A9]/10 text-[#0097A9]'
                        }`}>
                          {metrics.default_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-900">
                        {metrics.total_credits > 0 ? ((metrics.default_count / metrics.total_credits) * 100).toFixed(0) : 0}%
                      </td>
                    </tr>
                  </tbody>
                  {metrics.total_approved_amount > 0 && (
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-gray-900">Total Aprovado Acumulado</td>
                        <td colSpan={2} className="px-4 py-3 text-right font-bold text-gray-900 text-lg">
                          {formatCurrency(metrics.total_approved_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Histórico de Transações */}
            {transactions && transactions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase">Movimentaes Mensais (šltimos 6 Meses)</h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ms</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Créditos</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Débitos</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Saldo Final</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Nº Transações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((t: any) => (
                        <tr key={t.month} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{formatMonth(t.month)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-[#0097A9]">{formatCurrency(t.credits)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(t.debits)}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(t.balance)}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{t.transactions_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500">No foi possvel carregar as mtricas financeiras.</p>
            <p className="text-sm text-gray-400 mt-2">Verifique a conexo com o servidor.</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

function formatMonth(monthStr: string): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const [year, month] = monthStr.split('-')
  return `${months[parseInt(month) - 1]}/${year}`
}


