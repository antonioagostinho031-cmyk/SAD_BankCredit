import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Select } from '../ui/select'
import { documentsService } from '../../services/documents.service'

const DOC_TYPE_OPTIONS = [
  { value: 'bi',                      label: 'Bilhete de Identidade' },
  { value: 'nif',                     label: 'NIF' },
  { value: 'comprovativo_vinculo',    label: 'Comprovativo de Vínculo Laboral' },
  { value: 'comprovativo_rendimento', label: 'Comprovativo de Rendimento' },
  { value: 'passaporte',              label: 'Passaporte' },
  { value: 'cartao_residente',        label: 'Cartão de Residente' },
]

interface Props {
  clientId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function DocumentUploadModal({ clientId, open, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docType, setDocType] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: () => documentsService.upload(selectedFile!, clientId, docType, expiryDate || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      onSuccess()
      resetForm()
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Erro ao enviar documento')
    },
  })

  const resetForm = () => {
    setSelectedFile(null)
    setDocType('')
    setExpiryDate('')
    setError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSetFile(file)
  }

  const validateAndSetFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024 // 10 MB
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

    if (!allowed.includes(file.type)) {
      setError('Formato nao suportado. Use JPG, PNG, WebP ou PDF.')
      return
    }
    if (file.size > maxSize) {
      setError('Ficheiro demasiado grande. Limite: 10 MB.')
      return
    }

    setError('')
    setSelectedFile(file)
  }

  const handleSubmit = () => {
    if (!selectedFile) { setError('Seleccione um ficheiro'); return }
    if (!docType) { setError('Seleccione o tipo de documento'); return }
    uploadMutation.mutate()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); resetForm() }}
      title="Enviar Documento"
      size="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* File Drop Zone */}
        <div
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer
            ${dragOver ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-gray-50 hover:border-[#0097A9]/40 hover:bg-gray-50/30'}
            ${selectedFile ? 'border-[#0097A9] bg-[#0097A9]/5' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
          />

          {selectedFile ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-[#0097A9]" />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                className="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="mb-3 h-8 w-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-600">
                Arraste o ficheiro ou clique para seleccionar
              </p>
              <p className="mt-1 text-xs text-gray-400">
                JPG, PNG, WebP ou PDF — Maximo 10 MB
              </p>
            </>
          )}
        </div>

        {/* Document Type */}
        <Select
          label="Tipo de Documento"
          options={DOC_TYPE_OPTIONS}
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          placeholder="Seleccione o tipo..."
        />

        {/* Expiry Date (optional) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Data de Validade <span className="text-gray-400 text-xs">(opcional)</span>
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="h-9 rounded-md border border-gray-300 px-3 text-sm focus:border-[#0097A9] focus:outline-none"
          />
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-700">
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Apos o envio, o documento sera processado automaticamente pelo sistema de validacao por IA.
            A validacao humana pode ser necessaria dependendo do nivel de confianca.
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button variant="outline" type="button" onClick={() => { onClose(); resetForm() }}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            loading={uploadMutation.isPending}
            disabled={!selectedFile || !docType}
          >
            <Upload className="h-4 w-4" />
            Enviar Documento
          </Button>
        </div>
      </div>
    </Modal>
  )
}


