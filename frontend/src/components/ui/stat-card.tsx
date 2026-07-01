import * as React from 'react'
import { cn } from '../../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  className?: string
  color?: string // kept for backwards compat — ignored
}

export function StatCard({ title, value, subtitle, icon, className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {icon && (
          <div className="shrink-0 rounded-lg bg-[#0097A9]/10 p-2.5 text-[#0097A9]">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
