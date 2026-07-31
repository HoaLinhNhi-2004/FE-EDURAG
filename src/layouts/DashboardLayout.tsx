/*
  DashboardLayout
  - Purpose: Layout cho Giảng viên (TEACHER) và Quản trị viên (ADMIN).
  - Structure:
      • Sidebar trái (w-52): Logo + role badge, nav groups theo role,
        user profile (avatar + tên + info) ở dưới cùng với dropdown.
      • Main area (flex-1): render {children}.
  - Nav groups:
      • TEACHER: HỎI ĐÁP | HỌC LIỆU | CẤU HÌNH
      • ADMIN  : HỎI ĐÁP | TÀI KHOẢN | HẠ TẦNG AI | HỆ THỐNG
  - Role badge: "Giảng viên" (indigo) vs "SUPER ADMIN" (red) dưới logo.
  - Badge số: prop tùy chọn trên mỗi nav item — hook vào API khi triển khai thật.
  - Usage: <DashboardLayout><OverviewPage /></DashboardLayout>
  - Extend: thêm item vào TEACHER_NAV hoặc ADMIN_NAV bên dưới.
*/
import { useEffect, useState, type ReactNode, type ComponentType, type SVGProps } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import {
  BrandMark,
  ChatBubbleIcon,
  ClockIcon,
  UploadIcon,
  BellIcon,
  UserIcon,
  UsersIcon,
  ZapIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LogOutIcon,
  MenuIcon,
  DatabaseIcon,
} from '@/components/ui/icons'

// ─── Types ────────────────────────────────────────────────────────────────────
type IconProps = SVGProps<SVGSVGElement>

interface NavItem {
  label: string
  to: string
  Icon: ComponentType<IconProps>
  /** Badge số hiển thị góc phải (ví dụ: số thông báo chưa đọc). */
  badge?: number
}

interface NavGroup {
  heading: string
  items: NavItem[]
}

// ─── Nav config theo role ─────────────────────────────────────────────────────
const TEACHER_NAV: NavGroup[] = [
  {
    heading: 'HỎI ĐÁP',
    items: [
      { label: 'Hỏi đáp AI', to: '/dashboard/chat', Icon: ChatBubbleIcon },
      { label: 'Lịch sử chat', to: '/dashboard/history', Icon: ClockIcon },
    ],
  },
  {
    heading: 'HỌC LIỆU',
    items: [
      { label: 'Quản lý học liệu', to: '/dashboard/documents', Icon: UploadIcon },
      { label: 'Thư viện học liệu', to: '/dashboard/library', Icon: DatabaseIcon },
    ],
  },
  {
    heading: 'CẤU HÌNH',
    items: [
      // badge: lấy từ API thông báo khi triển khai thật
      { label: 'Thông báo', to: '/dashboard/notifications', Icon: BellIcon },
    ],
  },
]

const ADMIN_NAV: NavGroup[] = [
  {
    heading: 'HỎI ĐÁP',
    items: [
      { label: 'Hỏi đáp AI', to: '/dashboard/chat', Icon: ChatBubbleIcon },
      { label: 'Lịch sử chat', to: '/dashboard/history', Icon: ClockIcon },
    ],
  },
  {
    heading: 'HỌC LIỆU',
    items: [
      { label: 'Quản lý học liệu', to: '/dashboard/documents', Icon: UploadIcon },
      { label: 'Thư viện học liệu', to: '/dashboard/library', Icon: DatabaseIcon },
    ],
  },
  {
    heading: 'TÀI KHOẢN',
    items: [
      { label: 'Quản lý Người dùng', to: '/dashboard/users', Icon: UsersIcon },
    ],
  },
  {
    heading: 'HẠ TẦNG AI',
    items: [
      { label: 'FinOps & Token', to: '/dashboard/finops', Icon: ZapIcon },
    ],
  },
  {
    heading: 'HỆ THỐNG',
    items: [
      { label: 'Thông báo', to: '/dashboard/notifications', Icon: BellIcon },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string | undefined | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Màu avatar theo role */
function avatarColor(role: string | undefined): string {
  if (role === 'ADMIN') return 'bg-indigo-600'
  return 'bg-teal-600' // TEACHER
}

/** Label + style của role badge dưới logo */
function roleBadge(role: string | undefined): { label: string; className: string } {
  if (role === 'ADMIN') return { label: 'SUPER ADMIN', className: 'text-red-500' }
  return { label: 'Giảng viên', className: 'text-indigo-500' }
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  pathname,
  className = '',
  onNavigate,
}: {
  pathname: string
  /** Lớp bố cục do nơi gọi quyết định — cột cố định (md+) hay drawer (màn nhỏ). */
  className?: string
  /** Gọi khi chọn một mục — để drawer tự đóng sau khi điều hướng. */
  onNavigate?: () => void
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const role = user?.role
  const navGroups = role === 'ADMIN' ? ADMIN_NAV : TEACHER_NAV
  const initials = user ? getInitials(user.fullName ?? (user as any).full_name) : '?'
  const badge = roleBadge(role)

  /** Dòng phụ dưới tên: khoa (TEACHER) hoặc email (ADMIN) */
  const subline =
    role === 'ADMIN'
      ? (user?.email ?? '')
      : (user?.department ?? user?.academicTitle ?? '')

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`flex flex-col w-52 shrink-0 h-full bg-white border-r border-slate-200 ${className}`}>

      {/* ── Logo + role badge ── */}
      <div className="px-4 pt-5 pb-4 select-none">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="text-sm font-bold text-slate-900 tracking-tight">EduRAG</span>
        </div>
        <p className={`mt-1 ml-9 text-[10px] font-semibold tracking-wide ${badge.className}`}>
          {badge.label}
        </p>
      </div>

      {/* ── Nav groups ── */}
      <nav className="flex-1 flex flex-col gap-4 px-2 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.heading}>
            {/* Group heading */}
            <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
              {group.heading}
            </p>

            {/* Items */}
            {group.items.map(({ label, to, Icon, badge: itemBadge }) => {
              const isActive = pathname === to || pathname.startsWith(to + '/')
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  className={[
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ].join(' ')}
                >
                  <Icon
                    width={17}
                    height={17}
                    className={isActive ? 'text-indigo-600 flex-shrink-0' : 'text-slate-400 flex-shrink-0'}
                  />
                  <span className="flex-1 leading-tight">{label}</span>
                  {/* Badge số */}
                  {itemBadge != null && itemBadge > 0 && (
                    <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-semibold flex items-center justify-center">
                      {itemBadge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── User profile ── */}
      <div className="relative px-2 pb-4">
        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-1 mx-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-20">
            <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
              Tài khoản
            </p>
            <Link
              to="/dashboard/profile"
              onClick={() => {
                setMenuOpen(false)
                onNavigate?.()
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <UserIcon width={16} height={16} className="text-slate-500" />
              Hồ sơ cá nhân
            </Link>
            <div className="mx-3 border-t border-slate-100" />
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
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${avatarColor(role)}`}
          >
            {initials}
          </div>

          {/* Tên + dòng phụ */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.fullName ?? (user as any)?.full_name ?? '—'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{subline}</p>
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

// ─── DashboardLayout ──────────────────────────────────────────────────────────
interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { pathname } = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  // Đổi trang thì đóng drawer — tránh quay lại bằng nút Back mà menu vẫn mở.
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
        {/* Thanh trên chỉ có ở màn nhỏ, nơi sidebar bị ẩn */}
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Mở menu điều hướng"
            aria-expanded={navOpen}
            className="-ml-1 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <MenuIcon width={20} height={20} />
          </button>
          <BrandMark />
          <span className="text-sm font-bold tracking-tight text-slate-900">EduRAG</span>
        </header>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
