import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
} from 'lucide-react';
import { PortalLayout } from '../../components/portal/PortalLayout';
import { accountUpdateService } from '../../services/account-update.service';

export default function PortalHistoricoAtualizacoesPage() {
  const navigate = useNavigate();

  // Buscar todas as solicitações
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['update-requests'],
    queryFn: () => accountUpdateService.getMyUpdateRequests(),
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'pending_review':
      case 'pending_approval':
        return Clock;
      default:
        return AlertCircle;
    }
  };

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0097A9] mx-auto mb-4"></div>
            <p className="text-gray-600">A carregar histórico...</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (error) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erro ao Carregar Histórico
            </h2>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'Não foi possível carregar o histórico'}
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
    );
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
              <h1 className="text-2xl font-bold text-gray-900">
                Histórico de Atualizações
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Todas as suas solicitações de atualização de dados
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/portal/perfil/atualizacoes')}
            className="bg-[#0097A9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#007A8A] transition-colors"
          >
            Nova Solicitação
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total de Solicitações</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {requests?.length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Aguardando</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {requests?.filter(
                (r) => r.status === 'pending_approval' || r.status === 'pending_review'
              ).length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Aprovadas</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {requests?.filter((r) => r.status === 'approved').length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Rejeitadas</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {requests?.filter((r) => r.status === 'rejected').length || 0}
            </p>
          </div>
        </div>

        {/* Lista de Solicitações */}
        {!requests || requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma Solicitação Encontrada
            </h3>
            <p className="text-gray-600 mb-6">
              Você ainda não fez nenhuma solicitação de atualização de dados
            </p>
            <button
              onClick={() => navigate('/portal/perfil/atualizacoes')}
              className="bg-[#0097A9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#007A8A] transition-colors"
            >
              Fazer Primeira Solicitação
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const statusInfo = accountUpdateService.formatStatus(request.status);
              const StatusIcon = getStatusIcon(request.status);

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Solicitação de Atualização
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.color}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            {new Date(request.created_at).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/portal/perfil/atualizacoes/${request.id}`)
                        }
                        className="flex items-center gap-2 px-4 py-2 border-2 border-[#0097A9] text-[#0097A9] rounded-lg font-semibold hover:bg-[#0097A9]/5 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver Detalhes</span>
                      </button>
                    </div>

                    {/* Motivo */}
                    {request.reason && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Motivo:</p>
                        <p className="text-gray-900">{request.reason}</p>
                      </div>
                    )}

                    {/* Dados Solicitados */}
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        Campos Solicitados para Atualização:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(request.requested_data).map((field) => (
                          <span
                            key={field}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                          >
                            {field.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Mensagem de Aprovação/Rejeição */}
                    {request.status === 'approved' && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-green-900 mb-1">
                              Solicitação Aprovada
                            </p>
                            <p className="text-sm text-green-800">
                              Seus dados foram atualizados com sucesso em{' '}
                              {new Date(request.approved_at!).toLocaleDateString('pt-PT')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {request.status === 'rejected' && request.rejection_reason && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-red-900 mb-1">
                              Solicitação Rejeitada
                            </p>
                            <p className="text-sm text-red-800">
                              {request.rejection_reason}
                            </p>
                            {request.rejected_at && (
                              <p className="text-xs text-red-700 mt-2">
                                Rejeitada em{' '}
                                {new Date(request.rejected_at).toLocaleDateString('pt-PT')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {(request.status === 'pending_review' ||
                      request.status === 'pending_approval') && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-blue-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-blue-900 mb-1">
                              Em Revisão pelo Backoffice
                            </p>
                            <p className="text-sm text-blue-800">
                              Sua solicitação está sendo revisada pela equipe. Você será notificado quando houver uma decisão.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex gap-4">
            <AlertCircle className="h-6 w-6 text-blue-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Precisa de ajuda?
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Se tiver dúvidas sobre o status da sua solicitação ou precisar de mais
                informações, nossa equipe está disponível para ajudar.
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-blue-900">
                  <strong>Telefone:</strong> +244 933 168 400
                </span>
                <span className="text-blue-900">
                  <strong>Email:</strong> suporte@atlantico.ao
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
