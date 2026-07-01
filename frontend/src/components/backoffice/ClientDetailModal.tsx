import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { User, Building2, CreditCard, FileText, Edit, Upload, UserCheck, CheckCircle } from 'lucide-react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { documentsService } from '../../services/documents.service'
import { creditService } from '../../services/credit.service'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'
import type { Client, User as UserType } from '../../types'
import DocumentUploadModal from './DocumentUploadModal'
import GestorCreditRequestModal from './GestorCreditRequestModal'

interface Props {
  client: Client
  open: boolean
  onClose: () => void
  onEdit: () => void
}

export default function ClientDetailModal({ client, open, onClose, onEdit }: Props) {
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin'
  const isGestor = currentUser?.role === 'gestor'
  const isMyClient = isGestor && client.account_manager_id === currentUser?.id
  const queryClient = useQueryClient()

  const [showUpload, setShowUpload]             = useState(false)
  const [showCreditModal, setShowCreditModal]   = useState(false)
  const [selectedManager, setSelectedManager]   = useState<string>(client.account_manager_id ?? '')
  const [managerSaved, setManagerSaved]         = useState(false)

  const { data: allUsers = [] } = useQuery<UserType[]>({
    queryKey: ['users-list'],
    queryFn: async () => { const { data } = await api.get('/users'); return data },
    enabled: isAdmin && open,
  })
  const gestores = allUsers.filter(u => u.role === 'gestor' && u.active)

  const assignManagerMutation = useMutation({
    mutationFn: (managerId: string | null) =>
      api.patch(`/clients/${client.id}/assign-manager`, { account_manager_id: managerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setManagerSaved(true)
      setTimeout(() => setManagerSaved(false), 2500)
    },
  })

  const { data: documents = [], refetch: refetchDocs } = useQuery({
    queryKey: ['client-documents', client.id],
    queryFn: () => documentsService.getByClient(client.id),
    enabled: open,
  })

  const { data: credits = [] } = useQuery({
    queryKey: ['client-credits', client.id],
    queryFn: () => creditService.getByClient(client.id),
    enabled: open,
  })

  const docTypeLabel: Record<string, string> = {
    bi: 'Bilhete de Identidade',
    nif: 'NIF',
    comprovativo_vinculo: 'Comprovativo de Vínculo',
    comprovativo_rendimento: 'Comprovativo de Rendimento',
    passaporte: 'Passaporte',
    cartao_residente: 'Cartão de Residente',
  }

  return (
    <Modal open={open} onClose={onClose} title="Perfil do Cliente" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-700 text-xl font-bold">
              {client.full_name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{client.full_name}</h2>
              <p className="text-sm text-gray-500">{client.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(client.registration_status)}`}>
              {getStatusLabel(client.registration_status)}
            </span>
            {client.is_eligible_for_credit && (
              <span className="rounded-full bg-[#0097A9]/10 px-3 py-1 text-xs font-medium text-[#0097A9]">
                Elegivel
              </span>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Personal Data */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <User className="h-4 w-4 text-gray-400" />
              Dados Pessoais
            </div>
            <div className="space-y-2 rounded-lg bg-gray-50 p-3">
              <InfoRow label="BI" value={client.bi_number} />
              <InfoRow label="NIF" value={client.nif} />
              <InfoRow label="Data de Nascimento" value={client.date_of_birth ? formatDate(client.date_of_birth) : '-'} />
              <InfoRow label="Estado Civil" value={client.marital_status} />
              <InfoRow label="Telefone" value={client.phone} />
              <InfoRow label="Morada" value={client.address} />
            </div>
          </div>

          {/* Professional Data */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Building2 className="h-4 w-4 text-gray-400" />
              Dados Profissionais e Financeiros
            </div>
            <div className="space-y-2 rounded-lg bg-gray-50 p-3">
              <InfoRow label="Entidade Patronal" value={client.employer} />
              <InfoRow label="Cargo" value={client.job_title} />
              <InfoRow label="Rendimento Mensal" value={formatCurrency(client.monthly_income)} bold />
              <InfoRow label="Conta Bancaria" value={client.account_number} />
              <InfoRow label="Saldo" value={formatCurrency(client.account_balance)} />
            </div>
          </div>
        </div>

        {/* Gestor de Conta — secção visível sempre; editável só pelo admin */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <UserCheck className="h-4 w-4 text-gray-400" />
            Gestor de Conta
          </div>
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0097A9] focus:outline-none"
              >
                <option value="">-- Sem gestor atribuído --</option>
                {gestores.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.email})</option>
                ))}
              </select>
              <button
                onClick={() => assignManagerMutation.mutate(selectedManager || null)}
                disabled={assignManagerMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-[#0097A9] px-3 py-2 text-xs font-semibold text-white hover:bg-[#007A8A] transition-colors disabled:opacity-50"
              >
                {managerSaved
                  ? <><CheckCircle className="h-3.5 w-3.5" /> Guardado</>
                  : assignManagerMutation.isPending ? 'A guardar...' : 'Atribuir'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {gestores.find(g => g.id === client.account_manager_id)?.name
                ?? (client.account_manager_id ? 'Gestor atribuído' : 'Sem gestor atribuído')}
            </p>
          )}
        </div>

        {/* Documents */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText className="h-4 w-4 text-gray-400" />
              Documentos ({documents.length})
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}>
              <Upload className="h-3.5 w-3.5" />
              Enviar
            </Button>
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum documento submetido</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-gray-700">{docTypeLabel[doc.document_type] || doc.document_type}</p>
                    {doc.expiry_date && (
                      <p className="text-xs text-gray-400">Validade: {formatDate(doc.expiry_date)}</p>
                    )}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(doc.status)}`}>
                    {getStatusLabel(doc.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Credit History */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <CreditCard className="h-4 w-4 text-gray-400" />
            Historico de Credito ({credits.length})
          </div>
          {credits.length === 0 ? (
            <p className="text-sm text-gray-400">Sem pedidos de crdito anteriores</p>
          ) : (
            <div className="space-y-2">
              {credits.slice(0, 4).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <div>
                    <p className="text-xs font-medium">{formatCurrency(c.requested_amount)}</p>
                    <p className="text-xs text-gray-400">{c.term_months} meses — {c.purpose}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(c.status)}`}>
                      {getStatusLabel(c.status)}
                    </span>
                    <p className="mt-0.5 text-xs text-gray-400">{formatDate(c.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          {isMyClient && (
            <Button variant="outline" onClick={() => setShowCreditModal(true)}>
              <CreditCard className="h-4 w-4" />
              Solicitar Crédito
            </Button>
          )}
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4" />
            Editar Cliente
          </Button>
        </div>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        clientId={client.id}
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={() => { setShowUpload(false); refetchDocs() }}
      />

      {/* Gestor credit request modal */}
      {isMyClient && (
        <GestorCreditRequestModal
          client={{ id: client.id, full_name: client.full_name }}
          open={showCreditModal}
          onClose={() => setShowCreditModal(false)}
        />
      )}
    </Modal>
  )
}

function InfoRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="shrink-0 text-xs text-gray-500">{label}</span>
      <span className={`text-right text-xs ${bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
        {value || '-'}
      </span>
    </div>
  )
}


