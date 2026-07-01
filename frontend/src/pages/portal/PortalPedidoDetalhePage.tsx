import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle, FileText, Upload, MessageSquare } from 'lucide-react'
import { PortalLayout } from '../../components/portal/PortalLayout'
import { formatCurrency, formatDate } from '../../lib/utils'
import { creditRequestsService } from '../../services/credit-requests.service'

export default function PortalPedidoDetalhePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: pedido, isLoading, error } = useQuery({
    queryKey: ['credit-request-details', id],
    queryFn: () => creditRequestsService.getRequestDetails(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0097A9] mx-auto mb-4"></div>
            <p className="text-gray-600">A carregar detalhes do pedido...</p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  if (error || !pedido) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao Carregar Pedido</h2>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'Pedido não encontrado'}
            </p>
            <button
              onClick={() => navigate('/portal/credito/pedidos')}
              className="bg-[#0097A9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#007A8A] transition-colors"
            >
              Voltar aos Pedidos
            </button>
          </div>
        </div>
      </PortalLayout>
    )
  }

  const statusConfig = {
    submetido: { label: 'Submetido', color: 'bg-purple-500', icon: Clock },
    pendente: { label: 'Pendente', color: 'bg-gray-500', icon: Clock },
    em_analise: { label: 'Em Análise', color: 'bg-blue-500', icon: Clock },
    documentacao_pendente: { label: 'Documentação Pendente', color: 'bg-orange-500', icon: AlertCircle },
    aprovado: { label: 'Aprovado', color: 'bg-green-500', icon: CheckCircle },
    aprovado_condicional: { label: 'Aprovado Condicional', color: 'bg-teal-500', icon: CheckCircle },
    rejeitado: { label: 'Rejeitado', color: 'bg-red-500', icon: XCircle },
    cancelado: { label: 'Cancelado', color: 'bg-gray-500', icon: XCircle },
    desembolsado: { label: 'Desembolsado', color: 'bg-green-600', icon: CheckCircle },
  }

  const currentStatus = statusConfig[pedido.status as keyof typeof statusConfig] || statusConfig.pendente
  const StatusIcon = currentStatus.icon

  const documentStatusConfig = {
    pending: { label: 'Pendente', color: 'text-orange-600 bg-orange-50' },
    approved: { label: 'Aprovado', color: 'text-green-600 bg-green-50' },
    rejected: { label: 'Rejeitado', color: 'text-red-600 bg-red-50' },
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/portal/credito/pedidos')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#0097A9]">
                Detalhes do Pedido
              </h1>
              <p className="text-gray-600">Pedido #{pedido.requestNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`${currentStatus.color} text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2`}>
              <StatusIcon className="h-5 w-5" />
              {currentStatus.label}
            </div>
          </div>
        </div>

        {/* Resumo do Pedido */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Produto</p>
              <p className="font-semibold text-gray-900">{pedido.productName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Valor Solicitado</p>
              <p className="font-semibold text-gray-900">{formatCurrency(pedido.amount, 'AKZ')}</p>
            </div>
            {pedido.approvedAmount && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Valor Aprovado</p>
                <p className="font-semibold text-green-600">{formatCurrency(pedido.approvedAmount, 'AKZ')}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">Prazo</p>
              <p className="font-semibold text-gray-900">{pedido.term} meses</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Prestação Mensal (estimada)</p>
              <p className="font-semibold text-gray-900">{formatCurrency(pedido.monthlyPayment, 'AKZ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Taxa de Juro</p>
              <p className="font-semibold text-gray-900">{pedido.interestRate}% ao ano</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Data de Submissão</p>
              <p className="font-semibold text-gray-900">{formatDate(pedido.submittedAt)}</p>
            </div>
            {pedido.analyst && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Analista Responsável</p>
                <p className="font-semibold text-gray-900">{pedido.analyst}</p>
              </div>
            )}
            {pedido.conditions && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Condições de Aprovação</p>
                <p className="font-semibold text-gray-900">{pedido.conditions}</p>
              </div>
            )}
            {pedido.rejectionReason && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Motivo de Rejeição</p>
                <p className="font-semibold text-red-600">{pedido.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline de Progresso */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Progresso do Pedido</h2>
          <div className="space-y-6">
            {pedido.timeline.map((step, idx) => (
              <div key={idx} className="relative flex gap-4">
                {/* Linha vertical */}
                {idx < pedido.timeline.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200"></div>
                )}
                
                {/* Ícone */}
                <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'completed' 
                    ? 'bg-green-500' 
                    : step.status === 'current'
                    ? 'bg-blue-500 ring-4 ring-blue-100'
                    : 'bg-gray-300'
                }`}>
                  {step.status === 'completed' && <CheckCircle className="h-5 w-5 text-white" />}
                  {step.status === 'current' && <Clock className="h-5 w-5 text-white animate-pulse" />}
                  {step.status === 'pending' && <div className="h-3 w-3 bg-white rounded-full"></div>}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-semibold ${
                        step.status === 'current' ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {step.stage}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    </div>
                    {step.date && (
                      <span className="text-sm text-gray-500">
                        {formatDate(step.date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Documentos */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Documentos</h2>
              <button className="text-[#0097A9] hover:text-[#007A8A] font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Enviar
              </button>
            </div>
            {pedido.documents && pedido.documents.length > 0 ? (
              <div className="space-y-3">
                {pedido.documents.map((doc, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <FileText className="h-5 w-5 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-500">{formatDate(doc.uploadedAt)}</p>
                          {doc.reason && (
                            <p className="text-sm text-red-600 mt-1">{doc.reason}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        documentStatusConfig[doc.status as keyof typeof documentStatusConfig].color
                      }`}>
                        {documentStatusConfig[doc.status as keyof typeof documentStatusConfig].label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Nenhum documento anexado ainda
              </p>
            )}
          </div>

          {/* Mensagens */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Mensagens</h2>
              <MessageSquare className="h-5 w-5 text-gray-400" />
            </div>
            {pedido.messages && pedido.messages.length > 0 ? (
              <div className="space-y-4">
                {pedido.messages.map((msg, idx) => (
                  <div key={idx} className={`p-4 rounded-lg ${
                    msg.from === 'Analista' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold text-sm text-gray-900">{msg.from}</span>
                      <span className="text-xs text-gray-500">{formatDate(msg.date)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{msg.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Nenhuma mensagem ainda
              </p>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Precisa de ajuda?</h3>
              <p className="text-sm text-gray-600">Entre em contacto com o seu analista para esclarecimentos</p>
            </div>
            <button className="bg-[#0097A9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#007A8A] transition-colors">
              Enviar Mensagem
            </button>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
