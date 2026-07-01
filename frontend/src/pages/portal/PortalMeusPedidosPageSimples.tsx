import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Eye, FileText, Clock, CheckCircle, XCircle, AlertCircle, Upload
} from 'lucide-react'
import { PortalLayout } from '../../components/portal/PortalLayout'
import api from '../../services/api'

// Função inline para buscar pedidos
async function fetchMyRequests() {
  const { data } = await api.get('/credit/my-requests')
  return data.map((req: any) => ({
    id: req.id,
    requestNumber: `CR-${new Date(req.submission_date).getFullYear()}-${req.id.substring(0, 6).toUpperCase()}`,
    status: req.status,
    productName: req.purpose === 'habitacao' ? 'Crédito Habitação' :
                 req.purpose === 'automovel' ? 'Crédito Automóvel' :
                 req.purpose === 'pessoal' ? 'Crédito Pessoal' : 'Crédito',
    amount: req.requested_amount,
    term: req.term_months,
    monthlyPayment: req.monthly_payment,
    submittedAt: req.submission_date,
  }))
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
  }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export default function PortalMeusPedidosPageSimples() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['my-credit-requests-simple'],
    queryFn: fetchMyRequests,
  })

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0097A9] mx-auto mb-4"></div>
            <p className="text-gray-600">A carregar pedidos...</p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  if (error) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao Carregar Pedidos</h2>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'Não foi possível carregar os seus pedidos'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#0097A9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#007A8A] transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </PortalLayout>
    )
  }

  const filteredRequests = (requests || []).filter((request: any) => {
    const matchesSearch = request.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestNumber.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'aprovado': return CheckCircle
      case 'rejeitado': return XCircle
      case 'em_analise': return Clock
      case 'documentacao_pendente': return Upload
      default: return FileText
    }
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos de Crédito</h1>
          <p className="text-sm text-gray-600 mt-1">
            Acompanhe o estado dos seus pedidos
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total de Pedidos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{requests?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Em Análise</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {requests?.filter((r: any) => r.status === 'em_analise').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Aprovados</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {requests?.filter((r: any) => r.status === 'aprovado').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Pendentes</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {requests?.filter((r: any) => r.status === 'documentacao_pendente').length || 0}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Pesquisar por produto ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097A9] focus:border-transparent outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097A9] focus:border-transparent outline-none"
            >
              <option value="all">Todos os Estados</option>
              <option value="submetido">Submetido</option>
              <option value="em_analise">Em Análise</option>
              <option value="aprovado">Aprovado</option>
              <option value="rejeitado">Rejeitado</option>
              <option value="documentacao_pendente">Documentação Pendente</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de pesquisa'
                : 'Ainda não fez nenhum pedido de crédito'}
            </p>
            <button
              onClick={() => navigate('/portal/credito')}
              className="bg-[#0097A9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#007A8A] transition-colors"
            >
              Fazer Primeiro Pedido
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request: any) => {
              const StatusIcon = getStatusIcon(request.status)

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.productName}
                        </h3>
                        <StatusIcon className="h-5 w-5 text-[#0097A9]" />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Pedido #{request.requestNumber}</span>
                        <span>•</span>
                        <span>Submetido em {formatDate(request.submittedAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/portal/credito/pedido/${request.id}`)}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-[#0097A9] text-[#0097A9] rounded-lg font-semibold hover:bg-[#0097A9]/5 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver Detalhes</span>
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Montante Solicitado</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(request.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Prazo</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {request.term} meses
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Prestação Mensal</p>
                      <p className="text-lg font-semibold text-[#0097A9]">
                        {formatCurrency(request.monthlyPayment)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
