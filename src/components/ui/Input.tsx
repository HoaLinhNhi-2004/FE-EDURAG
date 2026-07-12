import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

/**
 * Ô nhập dùng chung. forwardRef để react-hook-form register() gắn ref được.
 * `invalid` để tô viền đỏ khi field lỗi (FormField tự truyền vào).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        invalid
          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
          : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200',
        className,
      )}
      {...props}
    />
  )
})
