/*
  ClientLayout
  - Purpose: Layout cho người dùng (Sinh viên) khi dùng tính năng chat.
  - Structure:
      • Sidebar trái cố định (160px): Logo EduRAG, 3 nav item có icon + active state,
        user profile (avatar initials + tên + mã SV + chevron) ở dưới cùng.
      • Khu vực nội dung (flex-1): render {children}.
      • Panel phải tùy chọn: truyền qua prop `rightPanel` (dùng cho panel Nguồn RAG
        chỉ hiển thị trên trang Chat).
  - Responsive: sidebar ẩn trên màn nhỏ (md:block).
  - Active nav: highlight bằng indigo-50 + indigo-600, dựa trên pathname.
  - Usage:
      <ClientLayout>
        <ChatPage />
      </ClientLayout>
      // Hoặc với panel phải (trang Chat):
      <ClientLayout rightPanel={<SourcesPanel />}>
        <ChatPage />
      </ClientLayout>
  - Extend: thêm nav item mới vào mảng `NAV_ITEMS`.
*/
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BrandMark,
  ChatBubbleIcon,
  ClockIcon,
  DocumentIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LogOutIcon,
  MenuIcon,
  UserIcon,
} from '@/components/ui/icons'
import { useAuth } from '@/store/auth'
import { UserAvatar } from '@/components/ui'

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Hỏi đáp AI', to: '/student', Icon: ChatBubbleIcon },
  { label: 'Lịch sử chat', to: '/student/history', Icon: ClockIcon },
  { label: 'Thư viện học liệu', to: '/student/library', Icon: DocumentIcon },
] as const

// ─── Sidebar component ────────────────────────────────────────────────────────
interface SidebarProps {
  pathname: string
  /** Lớp bố cục do nơi gọi quyết định — cột cố định (md+) hay drawer (màn nhỏ). */
  className?: string
  /** Gọi khi người dùng chọn một mục — để drawer tự đóng sau khi điều hướng. */
  onNavigate?: () => void
}

function Sidebar({ pathname, className = '', onNavigate }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`flex flex-col w-52 shrink-0 h-full bg-white border-r border-slate-200 ${className}`}>

      {/* ── Logo ── */}
      <div className="flex items-center gap-2 px-4 py-5 select-none shrink-0">
        <BrandMark />
        <span className="text-sm font-bold text-slate-900 tracking-tight">EduRAG</span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 flex flex-col gap-1 px-2 mt-2 overflow-y-auto">
        {NAV_ITEMS.map(({ label, to, Icon }) => {
          // "Hỏi đáp AI" chỉ active khi đúng /student, còn lại startsWith
          const isActive =
            to === '/student' ? pathname === '/student' : pathname.startsWith(to)

          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              ].join(' ')}
            >
              <Icon
                width={18}
                height={18}
                className={isActive ? 'text-indigo-600' : 'text-slate-400'}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* ── User profile ── */}
      <div className="relative px-2 pb-4 shrink-0">
        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-1 mx-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-20">
            {/* Header */}
            <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
              Tài khoản
            </p>
            {/* Hồ sơ cá nhân */}
            <Link
              to="/student/profile"
              onClick={() => {
                setMenuOpen(false)
                onNavigate?.()
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <UserIcon width={16} height={16} className="text-slate-500" />
              Hồ sơ cá nhân
            </Link>
            {/* Divider */}
            <div className="mx-3 border-t border-slate-100" />
            {/* Đăng xuất */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOutIcon width={16} height={16} />
              Đăng xuất
            </button>
          </div>
        )}

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
        >
          {/* User Avatar */}
          <UserAvatar user={user} size="sm" />

          {/* Name + student code — hiện đầy đủ, không truncate */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.fullName ?? (user as any)?.full_name ?? '—'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {user?.studentCode ?? user?.email ?? ''}
            </p>
          </div>

          {/* Chevron */}
          {menuOpen ? (
            <ChevronUpIcon width={14} height={14} className="text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDownIcon width={14} height={14} className="text-slate-400 flex-shrink-0" />
          )}
        </button>
      </div>
    </aside>
  )
}

// ─── ClientLayout ─────────────────────────────────────────────────────────────
interface ClientLayoutProps {
  children: ReactNode
  /** Panel phải tùy chọn — dùng cho "Nguồn RAG" trong trang Chat. */
  rightPanel?: ReactNode
}

export default function ClientLayout({ children, rightPanel }: ClientLayoutProps) {
  const { pathname } = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  // Đổi trang thì đóng drawer — tránh việc quay lại bằng nút Back mà menu vẫn mở.
  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar cột cố định — từ md trở lên */}
      <Sidebar pathname={pathname} className="hidden md:flex" />

      {/* Drawer — dưới md, mở bằng nút hamburger ở thanh trên */}
      {navOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Đóng menu điều hướng"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/40"
          />
          <div className="relative z-10 h-full w-52 shadow-xl">
            <Sidebar pathname={pathname} onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Thanh trên chỉ hiện ở màn nhỏ, nơi sidebar bị ẩn */}
        <header className="flex shrink-0 items-center border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Mở menu điều hướng"
            aria-expanded={navOpen}
            className="-ml-1 mr-2 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <MenuIcon width={20} height={20} />
          </button>
          <span className="flex items-center gap-2">
            <BrandMark />
            <span className="text-sm font-bold tracking-tight text-slate-900">EduRAG</span>
          </span>
        </header>

        {/* Main + optional right panel */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Content area */}
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>

          {/* Right panel (e.g. Nguồn RAG) */}
          {rightPanel && (
            <aside className="hidden lg:block w-72 xl:w-80 shrink-0 h-full border-l border-slate-200 bg-white overflow-y-auto">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
