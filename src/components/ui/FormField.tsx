import { type ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  /** Ghi chú phụ dưới label (vd: "MSV không thể sửa sau khi đăng ký"). */
  hint?: string
  children: ReactNode
}

/**
 * Bọc một trường form: label + ô nhập + thông báo lỗi.
 * `error` truyền từ formState.errors[field]?.message của react-hook-form.
 */
export function FormField({ label, htmlFor, required, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
