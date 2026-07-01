import * as React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || Math.random().toString(36).slice(2)

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm shadow-sm transition-colors',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-[#0097A9]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-red-500' : 'border-gray-300',
            className,
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }

