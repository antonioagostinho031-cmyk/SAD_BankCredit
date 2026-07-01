import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react';
import { PortalLayout } from '../../components/portal/PortalLayout';
import { accountUpdateService } from '../../services/account-update.service';

export default function PortalAtualizacaoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Buscar detalhes da solicitação
  const { data: request, isLoading, error } = useQuery({
    queryKey: ['update-request', id],
    queryFn: () => accountUpdateService.getUpdateRequest(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0097A9] mx-auto mb-4"></div>
            <p className="text-gray-600">A carregar detalhes...</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (error || !request) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Solicitação Não Encontrada
            </h2>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'Esta solicitação não existe ou foi removida'}
            </p>
            <button
              onClick={() => navigate('/portal/perfil/historico-atualizacoes')}
              className="bg-[#0097A9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#007A8A] transition-colors"
            >
              Voltar ao Histórico
            </button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const statusInfo = accountUpdateService.formatStatus(request.status);
  const getStatusIcon = () => {
    switch (request.status) {
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      default:
        return Clock;
    }
  };
  const StatusIcon = getStatusIcon();

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/portal/perfil/historico-atualizacoes')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Detalhes da Solicitação
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(request.created_at).toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div
              className={`h-16 w-16 rounded-full flex items-center justify-center ${statusInfo.bgColor}`}
            >
              <StatusIcon className={`h-8 w-8 ${statusInfo.color}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {statusInfo.label}
              </h2>
              <p className="text-sm text-gray-600">
                {request.status === 'approved' && 'Dados atualizados com sucesso'}
                {request.status === 'rejected' && 'Solicitação não aprovada'}
                {(request.status === 'pending_approval' ||
                  request.status === 'pending_review') &&
                  'Em análise pela equipe do backoffice'}
              </p>
            </div>
          </div>
        </div>

        {/* Motivo */}
        {request.reason && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0097A9]" />
              Motivo da Solicitação
            </h3>
            <p className="text-gray-700">{request.reason}</p>
          </div>
        )}

        {/* Comparação de Dados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-[#0097A9]" />
            Dados Solicitados para Atualização
          </h3>

          <div className="space-y-3">
            {Object.entries(request.requested_data).map(([field, value]) => (
              <div
                key={field}
                className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase">Campo</p>
                  <p className="text-sm font-medium text-gray-900">
                    {field.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase">Novo Valor</p>
                  <p className="text-sm font-semibold text-[#0097A9]">
                    {String(value || '-')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {request.current_data && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">
                Dados Atuais (Antes da Solicitação)
              </h4>
              <div className="grid md:grid-cols-2 gap-3">
                {Object.entries(request.current_data).map(([field, value]) => (
                  <div key={field} className="text-sm">
                    <span className="text-gray-600">{field.replace(/_/g, ' ')}:</span>{' '}
                    <span className="text-gray-900 font-medium">{String(value || '-')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mensagens de Aprovação/Rejeição */}
        {request.status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">
                  Solicitação Aprovada
                </h3>
                <p className="text-sm text-green-800 mb-3">
                  Seus dados foram atualizados com sucesso no sistema. As mudanças já
                  estão refletidas no seu perfil.
                </p>
                {request.approved_at && (
                  <p className="text-xs text-green-700">
                    Aprovado em{' '}
                    {new Date(request.approved_at).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {request.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex gap-4">
              <XCircle className="h-6 w-6 text-red-600 shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">
                  Solicitação Rejeitada
                </h3>
                {request.rejection_reason && (
                  <p className="text-sm text-red-800 mb-3">
                    <strong>Motivo:</strong> {request.rejection_reason}
                  </p>
                )}
                <p className="text-sm text-red-800 mb-3">
                  Você pode fazer uma nova solicitação com os documentos corretos ou
                  entrar em contacto com o banco para mais informações.
                </p>
                {request.rejected_at && (
                  <p className="text-xs text-red-700">
                    Rejeitado em{' '}
                    {new Date(request.rejected_at).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {(request.status === 'pending_review' ||
          request.status === 'pending_approval') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex gap-4">
              <Clock className="h-6 w-6 text-blue-600 shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Em Revisão pelo Backoffice
                </h3>
                <p className="text-sm text-blue-800">
                  Sua solicitação está sendo revisada pela nossa equipe. Os documentos enviados serão analisados manualmente. Você será notificado por email quando houver uma decisão.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-between gap-4">
          <button
            onClick={() => navigate('/portal/perfil/historico-atualizacoes')}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Voltar ao Histórico
          </button>
          {request.status === 'rejected' && (
            <button
              onClick={() => navigate('/portal/perfil/atualizacoes')}
              className="px-6 py-3 bg-[#0097A9] text-white rounded-lg font-semibold hover:bg-[#007A8A] transition-colors"
            >
              Nova Solicitação
            </button>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
