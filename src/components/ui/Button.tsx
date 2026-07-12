import { type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        fullWidth && 'w-full',
        VARIANT_CLASS[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
