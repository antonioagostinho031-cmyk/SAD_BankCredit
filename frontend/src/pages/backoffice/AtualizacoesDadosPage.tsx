import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, CheckCircle, XCircle, Clock, AlertCircle, Eye, User, Calendar,
  FileText, Info, Download, Loader2, Paperclip, ChevronLeft, ChevronRight,
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

interface DocInfo {
  originalName: string
  filename: string
  mimetype: string
  size: number
}

interface UpdateRequest {
  id: string
  client_id: string
  requested_data: Record<string, any>
  current_data: Record<string, any>
  documents_info?: DocInfo[]
  status: string
  reason: string
  created_at: string
  approved_at?: string
  rejected_at?: string
  rejection_reason?: string
  clients?: { id: string; full_name: string; email: string; phone: string }
}

const FIELD_LABELS: Record<string, string> = {
  full_name:      'Nome completo',
  email:          'Email',
  phone:          'Telefone',
  address:        'Morada',
  employer_name:  'Empregador',
  job_title:      'Cargo',
  monthly_income: 'Rendimento mensal',
  bi_number:      'Bilhete de Identidade',
  nif:            'NIF',
  reason:         'Motivo',
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending_review:   { label: 'Em Revisão',           color: 'bg-amber-50 text-amber-700 border border-amber-200', icon: Clock },
  pending_approval: { label: 'Aguardando Aprovação', color: 'bg-gray-100 text-gray-700',                          icon: Clock },
  approved:         { label: 'Aprovado',             color: 'bg-[#0097A9]/10 text-[#0097A9]',                     icon: CheckCircle },
  rejected:         { label: 'Rejeitado',            color: 'bg-red-50 text-red-600 border border-red-200',       icon: XCircle },
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export default function AtualizacoesDadosPage() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'admin'
  const isGestor = user?.role === 'gestor'

  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus]       = useState('all')
  const [searchTerm, setSearchTerm]           = useState('')
  const [selectedRequest, setSelectedRequest] = useState<UpdateRequest | null>(null)
  const [rejectReason, setRejectReason]       = useState('')
  const [actionFeedback, setActionFeedback]   = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Document viewer
  const [activeDocIdx, setActiveDocIdx]   = useState(0)
  const [blobUrls, setBlobUrls]           = useState<Record<string, string>>({})
  const [loadingDocs, setLoadingDocs]     = useState<Set<string>>(new Set())
  const [failedDocs, setFailedDocs]       = useState<Set<string>>(new Set())
  // tracks which keys we've already dispatched a fetch for (prevents duplicates)
  const requestedRef = useRef<Set<string>>(new Set())

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['update-requests', filterStatus],
    queryFn: async () => {
      const params = filterStatus !== 'all' ? { status: filterStatus } : {}
      const { data } = await api.get<UpdateRequest[]>('/clients/update-requests', { params })
      return data
    },
  })

  // Eager-load ALL documents the moment the modal opens for a request.
  // Uses requestedRef to guarantee each key is fetched exactly once, even if
  // the effect re-runs (e.g. React StrictMode double-invoke).
  useEffect(() => {
    if (!selectedRequest) {
      // modal closed — revoke every blob URL and reset ref
      setBlobUrls((prev) => {
        Object.values(prev).forEach((u) => URL.revokeObjectURL(u))
        return {}
      })
      setLoadingDocs(new Set())
      setFailedDocs(new Set())
      requestedRef.current = new Set()
      return
    }

    const docs = selectedRequest.documents_info ?? []
    if (!docs.length) return

    docs.forEach((doc) => {
      const key = `${selectedRequest.id}/${doc.filename}`
      if (requestedRef.current.has(key)) return   // already in-flight or done
      requestedRef.current.add(key)

      setLoadingDocs((prev) => new Set(prev).add(key))

      api
        .get(`/clients/update-request/${selectedRequest.id}/documents/${doc.filename}`, {
          responseType: 'blob',
        })
        .then((res) => {
          const url = URL.createObjectURL(res.data)
          setBlobUrls((prev) => ({ ...prev, [key]: url }))
        })
        .catch(() => {
          setFailedDocs((prev) => new Set(prev).add(key))
        })
        .finally(() => {
          setLoadingDocs((prev) => {
            const next = new Set(prev)
            next.delete(key)
            return next
          })
        })
    })
  }, [selectedRequest?.id])   // fires once per unique request opened

  // Keyboard navigation: ←/→ to switch docs, Escape to close modal
  useEffect(() => {
    if (!selectedRequest) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeModal(); return }
      const docs = selectedRequest.documents_info ?? []
      if (docs.length <= 1) return
      if (e.key === 'ArrowRight') setActiveDocIdx((i) => Math.min(i + 1, docs.length - 1))
      if (e.key === 'ArrowLeft')  setActiveDocIdx((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedRequest])

  const openModal = (req: UpdateRequest) => {
    // reset doc state before switching request so the eager-load effect fires clean
    requestedRef.current = new Set()
    setActiveDocIdx(0)
    setRejectReason('')
    setActionFeedback(null)
    setSelectedRequest(req)
  }

  const closeModal = () => {
    setSelectedRequest(null)
    setRejectReason('')
  }

  const downloadDoc = (doc: DocInfo) => {
    if (!selectedRequest) return
    const key  = `${selectedRequest.id}/${doc.filename}`
    const blob = blobUrls[key]
    const doDownload = (url: string) => {
      const a = document.createElement('a')
      a.href = url
      a.download = doc.originalName
      a.click()
    }
    if (blob) { doDownload(blob); return }
    api
      .get(`/clients/update-request/${selectedRequest.id}/documents/${doc.filename}`, { responseType: 'blob' })
      .then((res) => {
        const url = URL.createObjectURL(res.data)
        doDownload(url)
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      })
  }

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => api.patch(`/clients/update-request/${requestId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['update-requests'] })
      setActionFeedback({ type: 'success', msg: 'Solicitação aprovada. Os dados do cliente foram actualizados.' })
      setSelectedRequest(null)
    },
    onError: (error: any) => {
      setActionFeedback({ type: 'error', msg: error.response?.data?.message || error.message })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      api.patch(`/clients/update-request/${requestId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['update-requests'] })
      setActionFeedback({ type: 'success', msg: 'Solicitação rejeitada com sucesso.' })
      setSelectedRequest(null)
      setRejectReason('')
    },
    onError: (error: any) => {
      setActionFeedback({ type: 'error', msg: error.response?.data?.message || error.message })
    },
  })

  const clientName = (req: UpdateRequest) => req.clients?.full_name ?? 'Cliente Desconhecido'

  const filtered = requests.filter((req) => {
    const s = searchTerm.toLowerCase()
    return !s || clientName(req).toLowerCase().includes(s) || req.reason?.toLowerCase().includes(s)
  })

  const stats = {
    total:            requests.length,
    pending_review:   requests.filter((r) => r.status === 'pending_review').length,
    pending_approval: requests.filter((r) => r.status === 'pending_approval').length,
    approved:         requests.filter((r) => r.status === 'approved').length,
    rejected:         requests.filter((r) => r.status === 'rejected').length,
  }

  const canAct = (req: UpdateRequest) =>
    isGestor && (req.status === 'pending_review' || req.status === 'pending_approval')

  // Derived doc viewer helpers
  const activeDocs    = selectedRequest?.documents_info ?? []
  const activeDoc     = activeDocs[activeDocIdx] ?? null
  const blobKey       = activeDoc && selectedRequest ? `${selectedRequest.id}/${activeDoc.filename}` : null
  const blobUrl       = blobKey ? blobUrls[blobKey] : null
  const isLoadingDoc  = blobKey ? loadingDocs.has(blobKey) : false
  const isFailedDoc   = blobKey ? failedDocs.has(blobKey) : false
  const hasDocs       = activeDocs.length > 0
  const docTabState   = (doc: DocInfo) => {
    if (!selectedRequest) return 'idle'
    const k = `${selectedRequest.id}/${doc.filename}`
    if (blobUrls[k])      return 'ready'
    if (loadingDocs.has(k)) return 'loading'
    if (failedDocs.has(k))  return 'failed'
    return 'idle'
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-[#0097A9]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actualização de Dados</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAdmin
              ? 'Visão geral de todos os pedidos de actualização — apenas leitura'
              : 'Pedidos de actualização dos seus clientes'}
          </p>
        </div>
        {isAdmin && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
            <Info className="h-3.5 w-3.5" />
            Modo leitura — aprovação é exclusiva do gestor de conta
          </span>
        )}
      </div>

      {/* Feedback banner */}
      {actionFeedback && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${
          actionFeedback.type === 'success'
            ? 'border-[#0097A9]/30 bg-[#0097A9]/5 text-[#0097A9]'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {actionFeedback.type === 'success'
            ? <CheckCircle className="h-5 w-5 shrink-0" />
            : <AlertCircle className="h-5 w-5 shrink-0" />}
          <p className="text-sm font-medium">{actionFeedback.msg}</p>
          <button onClick={() => setActionFeedback(null)} className="ml-auto text-current opacity-60 hover:opacity-100">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { key: 'all',              label: 'Total',      value: stats.total,            color: 'text-gray-900' },
          { key: 'pending_review',   label: 'Em Revisão', value: stats.pending_review,   color: 'text-amber-600' },
          { key: 'pending_approval', label: 'A aguardar', value: stats.pending_approval, color: 'text-gray-700' },
          { key: 'approved',         label: 'Aprovados',  value: stats.approved,         color: 'text-[#0097A9]' },
          { key: 'rejected',         label: 'Rejeitados', value: stats.rejected,         color: 'text-red-600' },
        ].map((card) => (
          <button
            key={card.key}
            onClick={() => setFilterStatus(card.key)}
            className={`rounded-xl border-2 bg-white p-4 text-left transition-all ${
              filterStatus === card.key ? 'border-[#0097A9] shadow-sm' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Pesquisa */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Pesquisar cliente ou motivo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-[#0097A9] focus:outline-none"
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <FileText className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {requests.length === 0 ? 'Nenhum pedido de actualização.' : 'Nenhum resultado para o filtro aplicado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const si   = STATUS_MAP[req.status] ?? { label: req.status, color: 'bg-gray-100 text-gray-700', icon: AlertCircle }
            const Icon = si.icon
            const docCount = req.documents_info?.length ?? 0
            return (
              <div key={req.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <User className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-900 truncate">{clientName(req)}</span>
                      {req.clients?.email && (
                        <span className="text-xs text-gray-400 truncate">{req.clients.email}</span>
                      )}
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${si.color}`}>
                        <Icon className="h-3 w-3" />
                        {si.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(req.created_at).toLocaleDateString('pt-PT', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <span>·</span>
                      <span>{Object.keys(req.requested_data).filter((k) => k !== 'reason').length} campos</span>
                      {docCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-[#0097A9]">
                            <Paperclip className="h-3 w-3" />
                            {docCount} {docCount === 1 ? 'documento' : 'documentos'}
                          </span>
                        </>
                      )}
                    </div>
                    {req.reason && (
                      <p className="mt-2 text-xs text-gray-500 truncate">
                        <span className="font-medium text-gray-600">Motivo: </span>{req.reason}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.keys(req.requested_data)
                        .filter((k) => k !== 'reason')
                        .map((field) => (
                          <span key={field} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {FIELD_LABELS[field] ?? field.replace(/_/g, ' ')}
                          </span>
                        ))}
                    </div>
                  </div>
                  <button
                    onClick={() => openModal(req)}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Detalhes
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal de detalhes ─────────────────────────────────────────────── */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className={`w-full ${hasDocs ? 'max-w-6xl' : 'max-w-2xl'} max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl`}
          >
            {/* ── Modal header ── */}
            <div className="shrink-0 flex items-start justify-between gap-4 rounded-t-2xl border-b border-gray-100 bg-white px-6 pt-6 pb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{clientName(selectedRequest)}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(selectedRequest.created_at).toLocaleDateString('pt-PT', {
                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const si   = STATUS_MAP[selectedRequest.status] ?? { label: selectedRequest.status, color: 'bg-gray-100 text-gray-700', icon: AlertCircle }
                  const Icon = si.icon
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${si.color}`}>
                      <Icon className="h-3 w-3" />
                      {si.label}
                    </span>
                  )
                })()}
                <button onClick={closeModal} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ── Modal body — split or single ── */}
            <div className={`flex-1 min-h-0 flex ${hasDocs ? '' : 'overflow-y-auto'}`}>

              {/* Left — dados preenchidos */}
              <div className={`${hasDocs ? 'w-1/2 border-r border-gray-100 overflow-y-auto' : 'w-full'} px-6 pb-6 pt-5 space-y-5`}>

                {/* Motivo */}
                {selectedRequest.reason && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Motivo</p>
                    <p className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700">
                      {selectedRequest.reason}
                    </p>
                  </div>
                )}

                {/* Dados solicitados */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Dados a actualizar</p>
                  <div className="space-y-2">
                    {Object.entries(selectedRequest.requested_data)
                      .filter(([k]) => k !== 'reason')
                      .map(([field, value]) => (
                        <div key={field} className="rounded-lg border border-gray-200 bg-white p-3">
                          <p className="text-xs text-gray-400 mb-1">
                            {FIELD_LABELS[field] ?? field.replace(/_/g, ' ')}
                          </p>
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <p className="text-xs text-gray-400">Novo valor</p>
                              <p className="text-sm font-semibold text-[#0097A9]">{String(value || '-')}</p>
                            </div>
                            {selectedRequest.current_data?.[field] && (
                              <div className="flex-1">
                                <p className="text-xs text-gray-400">Valor actual</p>
                                <p className="text-sm text-gray-600">{selectedRequest.current_data[field]}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Decisão — gestor + estado pendente */}
                {canAct(selectedRequest) && (
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Decisão</p>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Motivo de rejeição{' '}
                        <span className="text-gray-400">(obrigatório para rejeitar)</span>
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                        placeholder="Indique o motivo caso pretenda rejeitar..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0097A9] focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => approveMutation.mutate(selectedRequest.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#0097A9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#007A8A] transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {approveMutation.isPending ? 'A aprovar...' : 'Aprovar'}
                      </button>
                      <button
                        onClick={() => {
                          if (!rejectReason.trim()) {
                            setActionFeedback({ type: 'error', msg: 'Indique o motivo de rejeição antes de rejeitar.' })
                            return
                          }
                          rejectMutation.mutate({ requestId: selectedRequest.id, reason: rejectReason })
                        }}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        {rejectMutation.isPending ? 'A rejeitar...' : 'Rejeitar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin: só leitura */}
                {isAdmin && (selectedRequest.status === 'pending_review' || selectedRequest.status === 'pending_approval') && (
                  <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800">
                      A aprovação deste pedido é da responsabilidade do gestor de conta atribuído ao cliente.
                      Como administrador, tem acesso de leitura apenas.
                    </p>
                  </div>
                )}

                {/* Aprovado */}
                {selectedRequest.status === 'approved' && selectedRequest.approved_at && (
                  <div className="flex gap-3 rounded-lg border border-[#0097A9]/20 bg-[#0097A9]/5 p-4">
                    <CheckCircle className="h-5 w-5 text-[#0097A9] shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#0097A9]">Aprovado</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Em {new Date(selectedRequest.approved_at).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Rejeitado */}
                {selectedRequest.status === 'rejected' && (
                  <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">Rejeitado</p>
                      {selectedRequest.rejection_reason && (
                        <p className="text-xs text-red-800 mt-0.5">{selectedRequest.rejection_reason}</p>
                      )}
                      {selectedRequest.rejected_at && (
                        <p className="text-xs text-red-600 mt-1">
                          Em {new Date(selectedRequest.rejected_at).toLocaleDateString('pt-PT')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right — Visualizador de documentos */}
              {hasDocs && (
                <div className="w-1/2 flex flex-col min-h-0 bg-gray-50 rounded-br-2xl">

                  {/* ── Barra superior: tabs + contador + download ── */}
                  <div className="shrink-0 border-b border-gray-200 bg-white px-4 pt-3 pb-2">

                    {/* Linha 1: tabs com indicador de estado */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {activeDocs.map((doc, idx) => {
                        const state   = docTabState(doc)
                        const isActive = idx === activeDocIdx
                        return (
                          <button
                            key={doc.filename}
                            onClick={() => setActiveDocIdx(idx)}
                            title={doc.originalName}
                            className={`shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              isActive
                                ? 'bg-[#0097A9] text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {/* Estado do documento na tab */}
                            {state === 'loading' ? (
                              <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                            ) : state === 'ready' ? (
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isActive ? 'bg-white' : 'bg-emerald-500'}`} />
                            ) : state === 'failed' ? (
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isActive ? 'bg-red-300' : 'bg-red-400'}`} />
                            ) : (
                              <FileText className="h-3 w-3 shrink-0" />
                            )}
                            <span className="max-w-[120px] truncate">
                              {activeDocs.length > 1 ? `${idx + 1}. ` : ''}{doc.originalName}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Linha 2: contador + navegação + download */}
                    {activeDocs.length > 1 && (
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setActiveDocIdx((i) => Math.max(i - 1, 0))}
                            disabled={activeDocIdx === 0}
                            className="rounded p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
                            title="Documento anterior (←)"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="text-xs text-gray-500 tabular-nums px-1">
                            {activeDocIdx + 1} / {activeDocs.length}
                          </span>
                          <button
                            onClick={() => setActiveDocIdx((i) => Math.min(i + 1, activeDocs.length - 1))}
                            disabled={activeDocIdx === activeDocs.length - 1}
                            className="rounded p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
                            title="Próximo documento (→)"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                        {activeDoc && (
                          <button
                            onClick={() => downloadDoc(activeDoc)}
                            className="flex items-center gap-1.5 rounded-lg border border-[#0097A9]/30 bg-[#0097A9]/5 px-2.5 py-1 text-xs font-medium text-[#0097A9] hover:bg-[#0097A9]/10 transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </button>
                        )}
                      </div>
                    )}

                    {/* Linha 2 alternativa quando há só 1 documento */}
                    {activeDocs.length === 1 && activeDoc && (
                      <div className="flex justify-end mt-1.5">
                        <button
                          onClick={() => downloadDoc(activeDoc)}
                          className="flex items-center gap-1.5 rounded-lg border border-[#0097A9]/30 bg-[#0097A9]/5 px-2.5 py-1 text-xs font-medium text-[#0097A9] hover:bg-[#0097A9]/10 transition-colors"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Área do visualizador ── */}
                  <div className="flex-1 min-h-0 p-3">
                    {isLoadingDoc ? (
                      <div className="flex h-full flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-[#0097A9]" />
                        <p className="text-xs text-gray-400">A carregar documento…</p>
                      </div>
                    ) : blobUrl ? (
                      activeDoc?.mimetype?.startsWith('image/') ? (
                        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white flex items-center justify-center p-3">
                          <img
                            src={blobUrl}
                            alt={activeDoc.originalName}
                            className="max-w-full max-h-full object-contain rounded"
                          />
                        </div>
                      ) : (
                        <iframe
                          src={blobUrl}
                          title={activeDoc?.originalName}
                          className="w-full h-full rounded-lg border border-gray-200 bg-white"
                        />
                      )
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white">
                        {isFailedDoc ? (
                          <>
                            <AlertCircle className="h-10 w-10 text-red-300" />
                            <p className="text-sm text-gray-500">Não foi possível pré-visualizar</p>
                          </>
                        ) : (
                          <>
                            <FileText className="h-10 w-10 text-gray-300" />
                            <p className="text-sm text-gray-400">Documento não disponível</p>
                          </>
                        )}
                        {activeDoc && (
                          <button
                            onClick={() => downloadDoc(activeDoc)}
                            className="flex items-center gap-1.5 rounded-lg bg-[#0097A9] px-4 py-2 text-xs font-semibold text-white hover:bg-[#007A8A] transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Fazer download
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Rodapé: nome, tamanho, dica de teclado ── */}
                  {activeDoc && (
                    <div className="shrink-0 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-2 rounded-br-2xl">
                      <span className="text-xs text-gray-400 truncate max-w-[55%]">{activeDoc.originalName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{fmtBytes(activeDoc.size)}</span>
                        {activeDocs.length > 1 && (
                          <span className="text-xs text-gray-300 hidden sm:block">← → para navegar</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
