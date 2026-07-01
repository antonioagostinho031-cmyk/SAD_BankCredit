import * as React from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '../../lib/utils'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
  onDismiss?: () => void
}

const config: Record<AlertVariant, { icon: React.ReactNode; classes: string }> = {
  info: {
    icon: <Info className="h-4 w-4" />,
    classes: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  success: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    classes: 'bg-green-50 border-green-200 text-green-800',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    classes: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  },
  error: {
    icon: <AlertCircle className="h-4 w-4" />,
    classes: 'bg-red-50 border-red-200 text-red-800',
  },
}

export function Alert({ variant = 'info', title, children, className, onDismiss }: AlertProps) {
  const { icon, classes } = config[variant]

  return (
    <div className={cn('flex gap-3 rounded-lg border p-4', classes, className)}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 text-sm">
        {title && <p className="font-medium">{title}</p>}
        <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
