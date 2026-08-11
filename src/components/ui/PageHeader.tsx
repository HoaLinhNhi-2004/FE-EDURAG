import type { ReactNode } from 'react'
import { BellIcon } from '@/components/ui/icons'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Các action button tùy chọn (VD: nút upload, filter…) — hiển thị bên trái bell. */
  actions?: ReactNode
}

/** Component Header dùng chung cố định ở trên cùng cho tất cả các trang (h-14, shrink-0, border-b, bg-white). */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Tiêu đề trang + subtitle */}
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="text-base font-semibold text-slate-800 tracking-tight truncate">{title}</h1>
        {subtitle && (
          <span className="hidden sm:inline-block text-xs text-slate-400 border-l border-slate-200 pl-3 py-0.5 truncate">
            {subtitle}
          </span>
        )}
      </div>

      {/* Khu vực bên phải: actions tùy chọn + bell icon */}
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <button
          type="button"
          aria-label="Thông báo"
          onClick={() => {}}
          className="relative flex items-center justify-center rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <BellIcon width={20} height={20} />
          {/* Badge chưa đọc — bỏ comment khi có dữ liệu thật */}
          {/* <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" /> */}
        </button>
      </div>
    </header>
  )
}
