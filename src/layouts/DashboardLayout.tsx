/*
  DashboardLayout
  - Purpose: Layout cho Giảng viên / Quản trị viên (trang quản trị).
  - Structure: cố định sidebar menu (ẩn trên màn nhỏ), header, content.
  - Usage: Wrap dashboard pages: <DashboardLayout><Overview/></DashboardLayout>
  - Extend: cập nhật <nav> để thêm mục quản lý (users, pipeline, finops...).
*/
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 hidden md:block border-r border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Quản trị</h2>
        <nav className="mt-4 flex flex-col gap-2 text-sm">
          <Link to="/dashboard" className="text-slate-700 hover:underline">Tổng quan</Link>
          <Link to="/dashboard/users" className="text-slate-700 hover:underline">Người dùng</Link>
          <Link to="/dashboard/pipeline" className="text-slate-700 hover:underline">Pipeline</Link>
        </nav>
      </aside>

      <div className="flex-1 p-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">Bảng điều khiển</h1>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}
