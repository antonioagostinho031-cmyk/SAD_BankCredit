import { cn } from '../../lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 gap-3', className)}>
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          {icon}
        </div>
      )}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {description && <p className="mt-0.5 text-xs text-gray-400">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
