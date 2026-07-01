import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, User, Mail, Phone,
  MapPin, Briefcase, FileText,
  CheckCircle, AlertCircle, Edit2, ClipboardList
} from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { PortalLayout } from '../../components/portal/PortalLayout'
import api from '../../services/api'

interface ClientData {
  full_name: string
  email: string
  phone: string
  date_of_birth: string
  bi_number: string
  nif: string
  address: string
  city: string
  province: string
  employer_name: string
  monthly_income: number
  account_number?: string
  account_balance?: number
}

export default function PortalPerfilPage() {
  const navigate = useNavigate()

  // Buscar dados do perfil
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['client-profile'],
    queryFn: async () => {
      const { data } = await api.get<ClientData>('/clients/my-profile')
      return data
    },
  })

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0097A9] mx-auto mb-4"></div>
            <p className="text-gray-600">A carregar perfil...</p>
          </div>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-sm text-gray-600 mt-1">
                Visualização das informações cadastrais
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/portal/perfil/historico-atualizacoes')}
              className="flex items-center gap-2 border border-[#0097A9] text-[#0097A9] px-5 py-3 rounded-lg font-semibold hover:bg-[#0097A9]/5 transition-colors"
            >
              <ClipboardList className="h-5 w-5" />
              <span>Meus Pedidos</span>
            </button>
            <button
              onClick={() => navigate('/portal/perfil/atualizacoes')}
              className="flex items-center gap-2 bg-[#0097A9] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#007A8A] transition-colors"
            >
              <Edit2 className="h-5 w-5" />
              <span>Solicitar Actualização</span>
            </button>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Informação Importante</p>
              <p>
                Para sua segurança, não é possível editar diretamente os dados cadastrais. 
                Para atualizar suas informações, clique em "Solicitar Atualização" e envie os 
                documentos comprovativos. Sua solicitação será analisada e aprovada pelo banco.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-gradient-to-r from-[#0097A9] to-[#007A8A] rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border-4 border-white/30">
              <User className="h-12 w-12" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{profileData?.full_name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{profileData?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{profileData?.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{profileData?.city}</span>
                </div>
              </div>
            </div>
            {profileData?.account_balance && (
              <div className="text-right">
                <p className="text-white/80 text-sm mb-1">Saldo Disponível</p>
                <p className="text-3xl font-bold">{formatCurrency(profileData.account_balance)}</p>
                {profileData?.account_number && (
                  <p className="text-white/80 text-xs mt-1">{profileData.account_number}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dados Pessoais */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-[#0097A9]" />
            Dados Pessoais
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Nome Completo
              </label>
              <p className="text-gray-900 font-medium">{profileData?.full_name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Email
              </label>
              <p className="text-gray-900 font-medium">{profileData?.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Telefone
              </label>
              <p className="text-gray-900 font-medium">{profileData?.phone}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Data de Nascimento
              </label>
              <p className="text-gray-900 font-medium">
                {profileData?.date_of_birth ? new Date(profileData.date_of_birth).toLocaleDateString('pt-PT') : '-'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Nº Bilhete de Identidade
              </label>
              <p className="text-gray-900 font-medium">{profileData?.bi_number}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                NIF (Número de Identificação Fiscal)
              </label>
              <p className="text-gray-900 font-medium">{profileData?.nif}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Morada Completa
            </label>
            <p className="text-gray-900 font-medium">{profileData?.address}</p>
            <p className="text-gray-600 text-sm mt-1">
              {profileData?.city}, {profileData?.province}
            </p>
          </div>
        </div>

        {/* Dados Financeiros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[#0097A9]" />
            Dados Profissionais e Financeiros
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Empresa/Empregador
              </label>
              <p className="text-gray-900 font-medium">{profileData?.employer_name || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Rendimento Mensal Líquido
              </label>
              <p className="text-gray-900 font-medium">
                {profileData?.monthly_income ? formatCurrency(profileData.monthly_income) : '-'}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-semibold mb-1">Atualização de Dados Financeiros</p>
                  <p className="mb-3">
                    Alterações aos dados financeiros requerem documentação comprobatória 
                    (recibos de vencimento, declaração de IRS, etc).
                  </p>
                  <button
                    onClick={() => navigate('/portal/perfil/atualizacoes')}
                    className="text-orange-700 font-semibold hover:text-orange-900 underline"
                  >
                    Solicitar Atualização de Dados Financeiros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#0097A9]" />
            Documentos
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: 'Bilhete de Identidade', status: 'verified', date: '2025-01-15' },
              { name: 'Comprovativo de Morada', status: 'verified', date: '2025-11-20' },
              { name: 'Comprovativo de Rendimento', status: 'verified', date: '2026-03-10' },
              { name: 'Declaração de IRT', status: 'pending', date: null },
            ].map((doc, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 hover:border-[#0097A9] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <FileText className="h-6 w-6 text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      {doc.date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Enviado em {new Date(doc.date).toLocaleDateString('pt-PT')}
                        </p>
                      )}
                    </div>
                  </div>
                  {doc.status === 'verified' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3" />
                      Verificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                      <AlertCircle className="h-3 w-3" />
                      Pendente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Precisa enviar novos documentos ou atualizar os existentes?
            </p>
            <button
              onClick={() => navigate('/portal/perfil/atualizacoes')}
              className="bg-[#0097A9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#007A8A] transition-colors"
            >
              Enviar Novos Documentos
            </button>
          </div>
        </div>

        {/* Ajuda */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Precisa de ajuda?</h3>
          <p className="text-sm text-blue-800 mb-3">
            Se tiver dúvidas sobre como atualizar seus dados ou precisar de assistência, 
            nossa equipa está disponível para ajudar.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-blue-900">
              <strong>Telefone:</strong> +244 933 168 400
            </span>
            <span className="text-blue-900">
              <strong>Email:</strong> suporte@atlantico.ao
            </span>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
