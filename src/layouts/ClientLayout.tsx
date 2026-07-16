/*
  ClientLayout
  - Purpose: Layout cho người dùng (Sinh viên) khi dùng tính năng chat.
  - Structure: sidebar (Lịch sử chat) + header + content area.
  - Responsive: sidebar ẩn trên màn nhỏ (sử dụng `hidden md:block`).
  - Usage: Wrap student pages: <ClientLayout><ChatPage/></ClientLayout>
  - Extend: thêm links vào <nav> để hiện các cuộc chat hoặc trang lịch sử.
  - Layout note: dùng h-screen + flex column và KHÔNG set padding ở đây, để trang con
    (ChatPage) tự quản vùng cuộn riêng (messages scroll, input ghim đáy).
*/
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useAuth } from '@/store/auth'

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="hidden md:block w-64 border-r border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Lịch sử chat</h2>
        <nav className="mt-4 flex flex-col gap-2">
          <Link to="/student" className="text-sm text-indigo-600 hover:underline">Hỏi đáp AI</Link>
          <Link to="/student/history" className="text-sm text-slate-600 hover:underline">Lịch sử chat</Link>
        </nav>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <h1 className="text-lg font-bold text-slate-900">EduRAG</h1>
          <div className="flex items-center gap-3">
            <Link to="/student/profile" className="text-sm font-medium text-indigo-600 hover:underline">
              Hồ sơ
            </Link>
            <span className="text-sm text-slate-600">{user?.fullName}</span>
            <Button variant="secondary" onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  )
}
