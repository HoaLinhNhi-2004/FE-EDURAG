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
import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BrandMark,
  ChatBubbleIcon,
  ClockIcon,
  DocumentIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LogOutIcon,
  UserIcon,
} from '@/components/ui/icons'
import { useAuth } from '@/store/auth'

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Hỏi đáp AI', to: '/student', Icon: ChatBubbleIcon },
  { label: 'Lịch sử chat', to: '/student/history', Icon: ClockIcon },
  { label: 'Xem tài liệu', to: '/student/documents', Icon: DocumentIcon },
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Lấy 2 chữ cái đầu từ fullName (VD: "Nguyễn Văn An" → "NA") */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Sidebar component ────────────────────────────────────────────────────────
interface SidebarProps {
  pathname: string
}

function Sidebar({ pathname }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const initials = user ? getInitials(user.fullName) : '?'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="hidden md:flex flex-col w-52 shrink-0 min-h-screen bg-white border-r border-slate-200">

      {/* ── Logo ── */}
      <div className="flex items-center gap-2 px-4 py-5 select-none">
        <BrandMark />
        <span className="text-sm font-bold text-slate-900 tracking-tight">EduRAG</span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 flex flex-col gap-1 px-2 mt-2">
        {NAV_ITEMS.map(({ label, to, Icon }) => {
          // "Hỏi đáp AI" chỉ active khi đúng /student, còn lại startsWith
          const isActive =
            to === '/student' ? pathname === '/student' : pathname.startsWith(to)

          return (
            <Link
              key={to}
              to={to}
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
      <div className="relative px-2 pb-4">
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
              onClick={() => setMenuOpen(false)}
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
          {/* Avatar initials */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>

          {/* Name + student code — hiện đầy đủ, không truncate */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.fullName ?? '—'}
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar pathname={pathname} />

      {/* Main + optional right panel */}
      <div className="flex flex-1 min-w-0">
        {/* Content area */}
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>

        {/* Right panel (e.g. Nguồn RAG) */}
        {rightPanel && (
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0 border-l border-slate-200 bg-white overflow-y-auto">
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  )
}