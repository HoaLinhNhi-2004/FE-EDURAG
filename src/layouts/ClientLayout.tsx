/*
  ClientLayout
  - Purpose: Layout cho người dùng (Sinh viên) khi dùng tính năng chat.
  - Structure: sidebar (Lịch sử chat) + header + content area.
  - Responsive: sidebar ẩn trên màn nhỏ (sử dụng `hidden md:block`).
  - Usage: Wrap student pages: <ClientLayout><ChatPage/></ClientLayout>
  - Extend: thêm links vào <nav> để hiện các cuộc chat hoặc trang lịch sử.
*/
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:block w-64 border-r border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Lịch sử chat</h2>
        <nav className="mt-4 flex flex-col gap-2">
          <Link to="/" className="text-sm text-indigo-600 hover:underline">Trò chuyện</Link>
          <Link to="/history" className="text-sm text-slate-600 hover:underline">Lịch sử</Link>
        </nav>
      </aside>

      <div className="flex-1 p-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">EduRAG</h1>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}
