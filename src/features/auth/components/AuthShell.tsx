import { type ReactNode } from 'react'
import { BrandMark } from '@/components/ui'

/**
 * Khung chung cho các màn xác thực (Đăng nhập / Đăng ký): thanh header EduRAG
 * + card trắng canh giữa. Dùng lại cho cả hai màn để đồng nhất giao diện.
 *
 * Ghi chú phối hợp: khi LN Long dựng AuthLayout (task 1.4) có thể chuyển phần
 * header ra layout; hiện gom ở đây để màn Client chạy độc lập được ngay.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-6 py-4">
        <BrandMark />
        <span className="text-lg font-semibold text-slate-900">EduRAG</span>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {children}
        </div>
      </main>
    </div>
  )
}
