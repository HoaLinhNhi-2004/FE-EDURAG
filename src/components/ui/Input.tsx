import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  /** Icon hiển thị bên trái trong ô (vd MailIcon, LockIcon). */
  leftIcon?: ReactNode
  /** Phần tử tương tác chèn bên phải trong ô (vd nút hiện/ẩn mật khẩu). */
  rightSlot?: ReactNode
}

/**
 * Ô nhập dùng chung. forwardRef để react-hook-form register() gắn ref được.
 * `invalid` tô viền đỏ khi field lỗi; `leftIcon` chèn icon prefix bên trái;
 * `rightSlot` chèn nút bên phải (khác leftIcon ở chỗ vẫn nhận được click).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, leftIcon, rightSlot, className, ...props },
  ref,
) {
  const control = (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border py-2 text-sm text-slate-900 placeholder:text-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        leftIcon ? 'pl-10' : 'pl-3',
        rightSlot ? 'pr-10' : 'pr-3',
        invalid
          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
          : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200',
        className,
      )}
      {...props}
    />
  )

  if (!leftIcon && !rightSlot) return control

  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          {leftIcon}
        </span>
      )}
      {control}
      {rightSlot && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-3">{rightSlot}</span>
      )}
    </div>
  )
})
