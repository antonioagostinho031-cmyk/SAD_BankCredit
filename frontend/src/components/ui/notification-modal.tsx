import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './button'

export type NotificationType = 'error' | 'success' | 'warning' | 'info'

export interface NotificationModalProps {
  open: boolean
  onClose: () => void
  type: NotificationType
  title?: string
  message: string
  confirmLabel?: string
}

const STYLES: Record<NotificationType, {
  icon: React.ReactElement
  defaultTitle: string
  headerBg: string
  headerBorder: string
  titleColor: string
  confirmVariant: 'default' | 'destructive' | 'success' | 'warning'
}> = {
  error: {
    icon: <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />,
    defaultTitle: 'Erro',
    headerBg: 'bg-red-50',
    headerBorder: 'border-red-200',
    titleColor: 'text-red-800',
    confirmVariant: 'destructive',
  },
  success: {
    icon: <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />,
    defaultTitle: 'Sucesso',
    headerBg: 'bg-green-50',
    headerBorder: 'border-green-200',
    titleColor: 'text-green-800',
    confirmVariant: 'success',
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />,
    defaultTitle: 'Aviso',
    headerBg: 'bg-amber-50',
    headerBorder: 'border-amber-200',
    titleColor: 'text-amber-800',
    confirmVariant: 'warning',
  },
  info: {
    icon: <Info className="h-6 w-6 text-[#0097A9] shrink-0" />,
    defaultTitle: 'Informação',
    headerBg: 'bg-teal-50',
    headerBorder: 'border-teal-200',
    titleColor: 'text-teal-800',
    confirmVariant: 'default',
  },
}

export function NotificationModal({
  open,
  onClose,
  type,
  title,
  message,
  confirmLabel = 'OK',
}: NotificationModalProps) {
  const s = STYLES[type]

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-sm rounded-xl bg-white shadow-xl overflow-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          {/* Coloured header */}
          <div className={cn('flex items-center justify-between px-5 py-4 border-b', s.headerBg, s.headerBorder)}>
            <div className="flex items-center gap-3">
              {s.icon}
              <Dialog.Title className={cn('text-base font-semibold', s.titleColor)}>
                {title ?? s.defaultTitle}
              </Dialog.Title>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-white/60 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            <Dialog.Description className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {message}
            </Dialog.Description>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-5 pb-5">
            <Button variant={s.confirmVariant} onClick={onClose}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
