import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

/** Component Header dùng chung cố định ở trên cùng cho tất cả các trang (h-14, shrink-0, border-b, bg-white). */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="text-base font-semibold text-slate-800 tracking-tight truncate">{title}</h1>
        {subtitle && (
          <span className="hidden sm:inline-block text-xs text-slate-400 border-l border-slate-200 pl-3 py-0.5 truncate">
            {subtitle}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </header>
  )
}
