import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'error' | 'success' | 'info'

interface AlertProps {
  variant?: Variant
  children: ReactNode
  className?: string
}

const VARIANT_CLASS: Record<Variant, string> = {
  error: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  info: 'bg-slate-50 text-slate-700 border-slate-200',
}

/**
 * Hộp thông báo cho form — dùng để hiển thị lỗi trả về từ API (ApiError.message)
 * hay thông báo thành công. Phục vụ yêu cầu "không để trắng màn hình" khi có lỗi.
 */
export function Alert({ variant = 'info', children, className }: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('rounded-lg border px-3 py-2 text-sm', VARIANT_CLASS[variant], className)}
    >
      {children}
    </div>
  )
}
