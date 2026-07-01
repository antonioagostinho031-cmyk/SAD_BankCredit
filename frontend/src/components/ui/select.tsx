import * as React from 'react'
import { cn } from '../../lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || Math.random().toString(36).slice(2)

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <select
          id={selectId}
          className={cn(
            'flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm shadow-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-[#0097A9]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-red-500' : 'border-gray-300',
            className,
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'

export { Select }

