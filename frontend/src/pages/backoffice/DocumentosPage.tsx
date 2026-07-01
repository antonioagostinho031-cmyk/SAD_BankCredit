import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, CheckCircle, XCircle, Clock, Upload } from 'lucide-react'
import { documentsService } from '../../services/documents.service'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Modal } from '../../components/ui/modal'
import { formatDate, getStatusColor, getStatusLabel } from '../../lib/utils'
import api from '../../services/api'
import DocumentUploadModal from '../../components/backoffice/DocumentUploadModal'
import { usePermissions } from '../../hooks/usePermissions'

const DOC_TYPE_LABELS: Record<string, string> = {
  bi: 'Bilhete de Identidade',
  nif: 'NIF',
  comprovativo_vinculo: 'Comprovativo de Vínculo',
  comprovativo_rendimento: 'Comprovativo de Rendimento',
  passaporte: 'Passaporte',
  cartao_residente: 'Cartão de Residente',
}

export default function DocumentosPage() {
  const queryClient = useQueryClient()
  const { canUploadDocument, canValidateDocument, canDeleteDocument } = usePermissions()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [validationNotes, setValidationNotes] = useState('')
  const [showValidate, setShowValidate] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadClientId, setUploadClientId] = useState('')

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', statusFilter],
    queryFn: () => documentsService.getAll(statusFilter ? { status: statusFilter } : {}),
  })

  const validateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      documentsService.validate(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      setShowValidate(false)
    },
  })

  const filtered = documents.filter((d: any) => {
    if (!search) return true
    const s = search.toLowerCase()
    return d.file_name?.toLowerCase().includes(s) || d.client_id?.toLowerCase().includes(s)
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar documentos..."
            className="h-9 w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 text-sm focus:border-[#0097A9] focus:outline-none focus:ring-1 focus:ring-[#0097A9]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-[#0097A9] focus:outline-none"
        >
          <option value="">Todos os estados</option>
          <option value="pendente">Pendente</option>
          <option value="em_validacao">Em Validação</option>
          <option value="aprovado">Aprovado</option>
          <option value="rejeitado">Rejeitado</option>
        </select>
        {canUploadDocument() && (
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4" />
            Enviar Documento
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>
            Documentos
            <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <svg className="h-6 w-6 animate-spin text-[#0097A9]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ficheiro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Data Upload</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-gray-400">
                      Nenhum documento encontrado
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <p className="max-w-[150px] truncate text-sm font-medium">{doc.file_name}</p>
                      <p className="text-xs text-gray-500">{doc.clients?.full_name ?? '—'}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {getStatusLabel(doc.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">{formatDate(doc.uploaded_at)}</span>
                    </TableCell>
                    <TableCell>
                      {doc.expiry_date ? (
                        <span className="text-xs text-gray-500">{formatDate(doc.expiry_date)}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {canValidateDocument() && (doc.status === 'pendente' || doc.status === 'em_validacao') ? (
                          <>
                            <button
                              onClick={() => validateMutation.mutate({ id: doc.id, status: 'aprovado' })}
                              className="rounded-md p-1.5 text-[#0097A9] hover:bg-[#0097A9]/10 transition-colors"
                              title="Aprovar"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedDoc(doc); setShowValidate(true) }}
                              className="rounded-md p-1.5 text-red-400 hover:bg-red-50 transition-colors"
                              title="Rejeitar"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <DocumentUploadModal
        clientId={uploadClientId}
        open={showUpload}
        onClose={() => { setShowUpload(false); setUploadClientId('') }}
        onSuccess={() => { setShowUpload(false); setUploadClientId('') }}
      />

      {/* Reject Modal */}
      <Modal
        open={showValidate}
        onClose={() => setShowValidate(false)}
        title="Rejeitar Documento"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Indique o motivo da rejeição do documento <strong>{selectedDoc?.file_name}</strong>.
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Motivo</label>
            <textarea
              value={validationNotes}
              onChange={(e) => setValidationNotes(e.target.value)}
              rows={3}
              placeholder="Descreva o motivo da rejeição..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#0097A9] focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowValidate(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              loading={validateMutation.isPending}
              onClick={() => {
                if (selectedDoc) {
                  validateMutation.mutate({
                    id: selectedDoc.id,
                    status: 'rejeitado',
                    notes: validationNotes,
                  })
                }
              }}
            >
              Confirmar Rejeição
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


