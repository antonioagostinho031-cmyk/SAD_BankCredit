import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Briefcase,
  Phone,
  Mail,
} from 'lucide-react';
import { PortalLayout } from '../../components/portal/PortalLayout';
import { accountUpdateService } from '../../services/account-update.service';
import type { UpdateDataRequestDto } from '../../services/account-update.service';
import api from '../../services/api';

interface ClientData {
  full_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  bi_number?: string;
  nif?: string;
  address?: string;
  employer?: string; // Backend usa 'employer' não 'employer_name'
  job_title?: string;
  monthly_income?: number;
}

type FeedbackModal =
  | { type: 'success' }
  | { type: 'error'; message: string; attempt: number }
  | null

export default function PortalAtualizacaoContaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [documents, setDocuments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackModal>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorAttempts, setErrorAttempts] = useState(0);

  // Formulário de dados
  const [formData, setFormData] = useState<UpdateDataRequestDto>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    employer_name: '', // Service espera employer_name
    monthly_income: '',
    reason: '',
  });

  // Buscar dados atuais do cliente
  const { data: currentData, isLoading: loadingCurrentData, error: loadError } = useQuery({
    queryKey: ['client-profile'],
    queryFn: async () => {
      const { data } = await api.get<ClientData>('/clients/my-profile');
      return data;
    },
    retry: 1,
  });

  // Mutation para criar solicitação
  const createRequestMutation = useMutation({
    mutationFn: () => accountUpdateService.createUpdateRequest(formData, documents),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['update-requests'] });
      setErrorAttempts(0);
      setFeedback({ type: 'success' });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message || 'Erro desconhecido';
      const attempts = errorAttempts + 1;
      setErrorAttempts(attempts);
      setFeedback({ type: 'error', message: msg, attempt: attempts });
    },
  });

  // Buscar histórico de solicitações
  const { data: updateRequests } = useQuery({
    queryKey: ['update-requests'],
    queryFn: () => accountUpdateService.getMyUpdateRequests(),
  });

  // Se houver erro ao carregar perfil - MOVIDO PARA DEPOIS DOS HOOKS
  if (loadError) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erro ao Carregar Perfil
            </h2>
            <p className="text-gray-600 mb-4">
              Não foi possível carregar seus dados. Tente novamente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#0097A9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#007A8A] transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = [...documents, ...files];
      setDocuments(newFiles);

      // Criar previews
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setValidationError(null);

    if (Object.values(formData).filter((v) => v && v !== '').length === 0) {
      setValidationError('Preencha pelo menos um campo para actualizar.');
      return;
    }
    if (documents.length === 0) {
      setValidationError('Anexe pelo menos um documento comprovativo.');
      return;
    }
    if (!formData.reason || formData.reason.trim() === '') {
      setValidationError('Informe o motivo da actualização.');
      return;
    }

    createRequestMutation.mutate();
  };

  const hasChanges = () => {
    return Object.entries(formData).some(([key, value]) => {
      if (!value || value === '') return false;
      const currentValue = currentData?.[key as keyof ClientData];
      return value !== currentValue?.toString();
    });
  };

  if (loadingCurrentData) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0097A9] mx-auto mb-4"></div>
            <p className="text-gray-600">A carregar dados...</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/portal/perfil')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Solicitar Atualização de Dados
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Preencha os novos dados e anexe documentos comprovativos
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= 1
                      ? 'bg-[#0097A9] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">Preencher Dados</p>
                  <p className="text-xs text-gray-600">Informações a atualizar</p>
                </div>
              </div>
            </div>

            <div
              className={`h-1 flex-1 mx-4 ${
                currentStep >= 2 ? 'bg-[#0097A9]' : 'bg-gray-200'
              }`}
            ></div>

            <div className="flex-1">
              <div className="flex items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= 2
                      ? 'bg-[#0097A9] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">Anexar Documentos</p>
                  <p className="text-xs text-gray-600">Upload de comprovativos</p>
                </div>
              </div>
            </div>

            <div
              className={`h-1 flex-1 mx-4 ${
                currentStep >= 3 ? 'bg-[#0097A9]' : 'bg-gray-200'
              }`}
            ></div>

            <div className="flex-1">
              <div className="flex items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= 3
                      ? 'bg-[#0097A9] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  3
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-gray-900">Revisar e Enviar</p>
                  <p className="text-xs text-gray-600">Confirmação final</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Preencher Dados */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Importante</p>
                    <p>
                      Preencha apenas os campos que deseja atualizar. Os campos em cinza
                      mostram seus dados atuais. Será necessário anexar documentos que
                      comprovem as alterações.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dados Pessoais */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados Pessoais
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      placeholder={currentData?.full_name || 'Nome atual'}
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097A9] focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Atual: {currentData?.full_name}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder={currentData?.email || 'Email atual'}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097A9] focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Atual: {currentData?.email}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      placeholder={currentData?.phone || 'Telefone atual'}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097A9] focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Atual: {currentData?.phone}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Morada
                    </label>
                    <input
                      type="text"
                      placeholder={currentData?.address || 'Morada atual'}
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097A9] focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Atual: {currentData?.address || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dados Profissionais */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Dados Profissionais
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empregador / Empresa
                    </label>
                    <input
                      type="text"
                      placeholder={currentData?.employer || 'Empresa atual'}
                      value={formData.employer_name}
                      onChange={(e) =>
                        setFormData({ ...formData, employer_name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097A9] focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Atual: {currentData?.employer || '-'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rendimento Mensal (Kz)
                    </label>
                    <input
                      type="number"
                      placeholder={currentData?.monthly_income?.toString() || '0'}
                      value={formData.monthly_income}
                      onChange={(e) =>
                        setFormData({ ...formData, monthly_income: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097A9] focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Actual: {currentData?.monthly_income?.toLocaleString('pt-AO')} Kz
                    </p>
                  </div>
                </div>
              </div>

              {/* Motivo */}
              <div className="pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da Atualização *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  rows={3}
                  placeholder="Ex: Mudança de morada, alteração de emprego, correção de dados..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0097A9] focus:border-transparent outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={() => navigate('/portal/perfil')}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!hasChanges()}
                  className="px-6 py-3 bg-[#0097A9] text-white rounded-lg font-semibold hover:bg-[#007A8A] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Próximo: Documentos →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Anexar Documentos */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-semibold mb-1">Documentos Obrigatórios</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li>Bilhete de Identidade (frente e verso)</li>
                      <li>
                        Comprovativo de Morada (fatura luz/água com menos de 3 meses)
                      </li>
                      <li>
                        Comprovativo de Rendimento (últimos 3 recibos de vencimento)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#0097A9] transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    Arraste documentos aqui
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    ou clique para selecionar ficheiros
                  </p>
                  <p className="text-xs text-gray-500">
                    Formatos aceites: JPG, PNG, PDF (máximo 10MB por ficheiro)
                  </p>
                </label>
              </div>

              {/* Lista de Documentos */}
              {documents.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">
                    Documentos Anexados ({documents.length})
                  </h4>
                  {documents.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        {previews[index] ? (
                          <img
                            src={previews[index]}
                            alt={file.name}
                            className="h-12 w-12 object-cover rounded"
                          />
                        ) : (
                          <FileText className="h-12 w-12 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeDocument(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-6">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={documents.length === 0}
                  className="px-6 py-3 bg-[#0097A9] text-white rounded-lg font-semibold hover:bg-[#007A8A] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Próximo: Revisar →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Revisar e Enviar */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold mb-1">Pronto para Enviar</p>
                    <p>
                      Revise as informações abaixo. Ao enviar, sua solicitação será
                      analisada automaticamente e enviada para aprovação.
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumo dos Dados */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">
                  Dados a Atualizar
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  {Object.entries(formData)
                    .filter(([, value]) => value && value !== '')
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="font-medium text-gray-900">{value}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Documentos */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">
                  Documentos Anexados ({documents.length})
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {previews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
                    >
                      <img
                        src={preview}
                        alt={documents[index].name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {validationError && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{validationError}</p>
                </div>
              )}

              <div className="flex justify-between pt-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createRequestMutation.isPending}
                  className="px-6 py-3 bg-[#F5A623] text-white rounded-lg font-semibold hover:bg-[#E09615] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createRequestMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>A enviar...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Enviar Solicitação</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Histórico de Solicitações */}
        {updateRequests && updateRequests.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Solicitações Anteriores
            </h3>
            <div className="space-y-3">
              {updateRequests.slice(0, 3).map((request) => {
                const statusInfo = accountUpdateService.formatStatus(request.status);
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(request.created_at).toLocaleDateString('pt-PT')}
                      </p>
                      <p className="text-sm text-gray-600">{request.reason}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal de feedback (sucesso / erro) ─────────────────────────── */}
      {feedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 text-center">

            {feedback.type === 'success' ? (
              <>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Pedido enviado com sucesso!
                </h2>
                <p className="text-gray-600 mb-1">
                  A sua solicitação foi recebida e está a aguardar revisão pelo gestor de conta.
                </p>
                <div className="my-5 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
                  <Clock className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Prazo de resposta</p>
                    <p className="text-sm text-blue-800">
                      O gestor irá analisar os documentos e responder em <strong>1 a 3 dias úteis</strong>.
                      Receberá uma notificação assim que houver uma decisão.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setFeedback(null); navigate('/portal/perfil/historico-atualizacoes'); }}
                  className="w-full rounded-lg bg-[#0097A9] px-6 py-3 font-semibold text-white hover:bg-[#007A8A] transition-colors"
                >
                  Ver histórico de pedidos
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Erro ao enviar pedido
                </h2>
                <p className="text-sm text-gray-500 mb-4 bg-gray-50 rounded-lg p-3 text-left font-mono">
                  {feedback.message}
                </p>

                {feedback.attempt < 2 ? (
                  <>
                    <p className="text-gray-600 mb-5">
                      Verifique se os dados e os documentos estão correctos e tente novamente.
                    </p>
                    <button
                      onClick={() => setFeedback(null)}
                      className="w-full rounded-lg bg-[#0097A9] px-6 py-3 font-semibold text-white hover:bg-[#007A8A] transition-colors"
                    >
                      Tentar novamente
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 mb-5">
                      O erro persistiu. Por favor contacte o suporte para que possamos ajudar.
                    </p>
                    <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-left space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone className="h-4 w-4 text-[#0097A9]" />
                        <span><strong>Telefone:</strong> +244 933 168 400</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail className="h-4 w-4 text-[#0097A9]" />
                        <span><strong>Email:</strong> suporte@atlantico.ao</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setFeedback(null)}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Fechar
                      </button>
                      <button
                        onClick={() => { setErrorAttempts(0); setFeedback(null); }}
                        className="flex-1 rounded-lg bg-[#0097A9] px-4 py-3 font-semibold text-white hover:bg-[#007A8A] transition-colors"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
