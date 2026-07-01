import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, XCircle, Plus, FileText } from 'lucide-react'
import { PortalLayout } from '../../components/portal/PortalLayout'
import { formatDate } from '../../lib/utils'

export default function PortalAtualizacoesPage() {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Dados mockados - substituir por chamada à API
  const updateRequests = [
    {
      id: '1',
      type: 'Dados Pessoais',
      status: 'aprovado',
      submittedAt: new Date('2024-05-15'),
      approvedAt: new Date('2024-05-16'),
      approvedBy: 'Maria Gestora Silva',
      fields: [
        { field: 'Telefone', oldValue: '+244 923 000 000', newValue: '+244 923 500 001' },
        { field: 'Email', oldValue: 'antigo@email.com', newValue: 'novo@email.com' }
      ]
    },
    {
      id: '2',
      type: 'Dados Financeiros',
      status: 'pendente',
      submittedAt: new Date('2024-06-10'),
      fields: [
        { field: 'Rendimento Mensal', oldValue: 'AOA 700.000', newValue: 'AOA 800.000' },
        { field: 'Entidade Patronal', oldValue: 'Empresa ABC', newValue: 'Sonangol EP' }
      ]
    },
    {
      id: '3',
      type: 'Endereço',
      status: 'rejeitado',
      submittedAt: new Date('2024-06-05'),
      rejectedAt: new Date('2024-06-06'),
      rejectionReason: 'Comprovativo de residência não corresponde ao endereço indicado',
      fields: [
        { field: 'Rua', oldValue: 'Av. 4 de Fevereiro', newValue: 'Rua da Constituição' },
        { field: 'Número', oldValue: '200', newValue: '123' }
      ]
    },
    {
      id: '4',
      type: 'Documentos',
      status: 'em_analise',
      submittedAt: new Date('2024-06-12'),
      fields: [
        { field: 'Bilhete de Identidade', oldValue: 'Validade: 2024-12-31', newValue: 'Validade: 2029-12-31' }
      ]
    }
  ]

  const statusConfig = {
    pendente: { 
      label: 'Pendente', 
      color: 'bg-gray-500 text-white', 
      icon: Clock,
      description: 'Aguardando revisão'
    },
    em_analise: { 
      label: 'Em Análise', 
      color: 'bg-blue-500 text-white', 
      icon: Clock,
      description: 'Em análise pela equipa'
    },
    aprovado: { 
      label: 'Aprovado', 
      color: 'bg-green-500 text-white', 
      icon: CheckCircle,
      description: 'Alterações aplicadas'
    },
    rejeitado: { 
      label: 'Rejeitado', 
      color: 'bg-red-500 text-white', 
      icon: XCircle,
      description: 'Não aprovado'
    }
  }

  const typeColors: Record<string, string> = {
    'Dados Pessoais': 'border-blue-300 bg-blue-50',
    'Dados Financeiros': 'border-green-300 bg-green-50',
    'Endereço': 'border-purple-300 bg-purple-50',
    'Documentos': 'border-orange-300 bg-orange-50'
  }

  const filteredRequests = filterStatus === 'all'
    ? updateRequests
    : updateRequests.filter(req => req.status === filterStatus)

  const statusCounts = {
    all: updateRequests.length,
    pendente: updateRequests.filter(r => r.status === 'pendente').length,
    em_analise: updateRequests.filter(r => r.status === 'em_analise').length,
    aprovado: updateRequests.filter(r => r.status === 'aprovado').length,
    rejeitado: updateRequests.filter(r => r.status === 'rejeitado').length
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/portal/perfil')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#0097A9]">
                Solicitações de Atualização
              </h1>
              <p className="text-gray-600">Histórico de alterações de dados cadastrais</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/portal/perfil')}
            className="bg-[#0097A9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#007A8A] transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nova Solicitação
          </button>
        </div>

        {/* Resumo de Status */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            onClick={() => setFilterStatus('all')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              filterStatus === 'all'
                ? 'border-[#0097A9] bg-[#0097A9]/10'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
            <p className="text-sm text-gray-600">Todas</p>
          </button>
          
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                filterStatus === key
                  ? 'border-[#0097A9] bg-[#0097A9]/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-2xl font-bold text-gray-900">
                {statusCounts[key as keyof typeof statusCounts]}
              </p>
              <p className="text-sm text-gray-600">{config.label}</p>
            </button>
          ))}
        </div>

        {/* Lista de Solicitações */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-200 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma solicitação encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                {filterStatus === 'all'
                  ? 'Ainda não fez nenhuma solicitação de atualização'
                  : 'Não há solicitações com este status'}
              </p>
              <button 
                onClick={() => navigate('/portal/perfil')}
                className="bg-[#0097A9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#007A8A] transition-colors"
              >
                Fazer Nova Solicitação
              </button>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const statusInfo = statusConfig[request.status as keyof typeof statusConfig]
              const StatusIcon = statusInfo.icon
              
              return (
                <div
                  key={request.id}
                  className={`bg-white rounded-xl shadow-lg p-6 border-2 ${typeColors[request.type] || 'border-gray-200'}`}
                >
                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.type}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${statusInfo.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Submetido em {formatDate(request.submittedAt)}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">#{request.id}</span>
                  </div>

                  {/* Campos Alterados */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Alterações Solicitadas</h4>
                    <div className="space-y-3">
                      {request.fields.map((field, idx) => (
                        <div key={idx} className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">Campo</p>
                            <p className="font-medium text-gray-900">{field.field}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Valor Anterior</p>
                            <p className="text-gray-700 line-through">{field.oldValue}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Novo Valor</p>
                            <p className="font-semibold text-[#0097A9]">{field.newValue}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Detalhado */}
                  <div className="flex items-center justify-between">
                    <div>
                      {request.status === 'aprovado' && request.approvedAt && (
                        <p className="text-sm text-green-600">
                          Aprovado em {formatDate(request.approvedAt)} por {request.approvedBy}
                        </p>
                      )}
                      {request.status === 'rejeitado' && request.rejectedAt && (
                        <div>
                          <p className="text-sm text-red-600 mb-1">
                            Rejeitado em {formatDate(request.rejectedAt)}
                          </p>
                          {request.rejectionReason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                              <p className="text-sm font-semibold text-red-900 mb-1">Motivo</p>
                              <p className="text-sm text-red-700">{request.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {(request.status === 'pendente' || request.status === 'em_analise') && (
                        <p className="text-sm text-gray-600">
                          {statusInfo.description}
                        </p>
                      )}
                    </div>
                    
                    {request.status === 'rejeitado' && (
                      <button 
                        onClick={() => navigate('/portal/perfil')}
                        className="text-[#0097A9] hover:text-[#007A8A] font-semibold text-sm"
                      >
                        Tentar Novamente
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Informação Adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Informação Importante</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Alterações de dados pessoais são analisadas em até 2 dias úteis</li>
            <li>• Alterações de dados financeiros podem requerer documentação adicional</li>
            <li>• Alterações de endereço requerem comprovativo de residência atualizado</li>
            <li>• Pode acompanhar o estado da sua solicitação nesta página</li>
          </ul>
        </div>
      </div>
    </PortalLayout>
  )
}
