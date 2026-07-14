import { type ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  /** Ghi chú phụ dưới ô nhập (vd: "Chỉ chấp nhận email @student.*.edu.vn"). */
  hint?: string
  children: ReactNode
}

/**
 * Bọc một trường form: label (IN HOA theo design) + ô nhập + hint/lỗi bên dưới.
 * `error` truyền từ formState.errors[field]?.message của react-hook-form;
 * khi có lỗi thì thay chỗ hint.
 */
export function FormField({ label, htmlFor, required, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
