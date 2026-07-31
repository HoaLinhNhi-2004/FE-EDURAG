import { useState, useEffect, useCallback } from 'react'
import { getAccessToken } from '@/utils/token'
import type { User, Role, UserStatus } from '@/types'
import { mapBackendUser, type RawUser } from '@/api/user.mapper'
import { SearchIcon } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui'
import { useAuth } from '@/store/auth'

const API = import.meta.env.VITE_API_BASE_URL

// ─── SVG Icons ─────────────────────────────────────────────────────────
function IconEye({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconUnlock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  )
}

function IconRotateCcw({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

// ─── Status Map ────────────────────────────────────────────────────────
const STATUS_MAP: Record<UserStatus, { label: string; cls: string; dot: string }> = {
  ACTIVE: {
    label: 'Hoạt động',
    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  PENDING: {
    label: 'Chờ duyệt',
    cls: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  LOCKED: {
    label: 'Đã khóa',
    cls: 'bg-red-100 text-red-600 border-red-200',
    dot: 'bg-red-500',
  },
  REJECTED: {
    label: 'Bị từ chối',
    cls: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
}

// ─── Role Map ──────────────────────────────────────────────────────────
const ROLE_MAP: Record<Role, { label: string; cls: string }> = {
  ADMIN: { label: 'Admin', cls: 'bg-rose-100 text-rose-700 border-rose-200' },
  TEACHER: { label: 'Giảng viên', cls: 'bg-teal-100 text-teal-700 border-teal-200' },
  STUDENT: { label: 'Sinh viên', cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
}

export function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Filters state
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Modals state
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userDetail, setUserDetail] = useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Interactive Action Dialogs state
  const [actionType, setActionType] = useState<'REJECT' | null>(null)
  const [actionUserId, setActionUserId] = useState<number | null>(null)
  const [noteText, setNoteText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch Users List
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const tok = getAccessToken()
      const roleParam = roleFilter === 'ALL' ? '' : `&role=${roleFilter}`
      const statusParam = statusFilter === 'ALL' ? '' : `&status=${statusFilter}`
      const searchParam = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''
      
      const res = await fetch(
        `${API}/admin/users?page=${page}&limit=${limit}${roleParam}${statusParam}${searchParam}`,
        {
          headers: { Authorization: `Bearer ${tok}` },
        }
      )
      if (res.ok) {
        const data = await res.json()
        const rawUsers: RawUser[] = data.data?.users ?? data.data?.items ?? []
        setUsers(rawUsers.map(mapBackendUser).filter((u): u is User => u !== null))
        setTotal(data.data?.total ?? 0)
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err)
    } finally {
      setLoading(false)
    }
  }, [roleFilter, statusFilter, page, limit, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (page === 1) {
      fetchUsers()
    } else {
      setPage(1)
    }
  }

  // Fetch User Details
  const handleViewDetail = async (user: User) => {
    setSelectedUser(user)
    setUserDetail(null)
    setLoadingDetail(true)
    try {
      const tok = getAccessToken()
      const res = await fetch(`${API}/admin/users/${user.id}`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUserDetail(data.data)
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết người dùng:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Update Status Action Handler
  const handleUpdateStatus = async (id: number, status: UserStatus, extra: { reviewNote?: string; lockReason?: string } = {}) => {
    try {
      const tok = getAccessToken()
      const res = await fetch(`${API}/admin/users/${id}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tok}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, ...extra }),
      })
      const data = await res.json()
      if (res.ok) {
        const updated = mapBackendUser(data.data as RawUser)
        if (updated) {
          // Update in list
          setUsers(prev => prev.map(u => (u.id === id ? updated : u)))
          // If the updated user is currently viewed, update the viewed user
          if (selectedUser?.id === id) {
            setSelectedUser(updated)
            // Reload details to get audit notes
            const detailRes = await fetch(`${API}/admin/users/${id}`, {
              headers: { Authorization: `Bearer ${tok}` },
            })
            if (detailRes.ok) {
              const detailData = await detailRes.json()
              setUserDetail(detailData.data)
            }
          }
        }
        // Reset action dialog state
        setActionType(null)
        setActionUserId(null)
        setNoteText('')
        setErrorMsg('')
      } else {
        setErrorMsg(data.message ?? 'Cập nhật trạng thái thất bại.')
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err)
      setErrorMsg('Đã xảy ra lỗi hệ thống.')
    }
  }

  const handleActionConfirm = () => {
    if (!actionUserId || !actionType) return
    if (!noteText.trim()) {
      setErrorMsg('Nội dung này là bắt buộc.')
      return
    }

    if (actionType === 'REJECT') {
      handleUpdateStatus(actionUserId, 'REJECTED', { reviewNote: noteText.trim() })
    }
  }

  const getInitials = (name: string | undefined | null): string => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—'
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString))
  }

  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden bg-slate-50">
      <PageHeader
        title="Quản lý Người dùng"
        subtitle="Tra cứu tài khoản, duyệt thành viên và thay đổi trạng thái hoạt động hệ thống"
      />
      <div className="flex-1 min-h-0 overflow-y-auto p-6 animate-fade-in flex flex-col">

        {/* ── Toolbar: filters, search ── */}
        <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Role */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vai trò</label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  const newRole = e.target.value as any
                  setRoleFilter(newRole)
                  if (newRole === 'STUDENT' && (statusFilter === 'PENDING' || statusFilter === 'REJECTED')) {
                    setStatusFilter('ALL')
                  }
                  setPage(1)
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="ADMIN">Admin</option>
                <option value="TEACHER">Giảng viên</option>
                <option value="STUDENT">Sinh viên</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any)
                  setPage(1)
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động</option>
                {roleFilter !== 'STUDENT' && <option value="PENDING">Chờ duyệt</option>}
                <option value="LOCKED">Đã khóa</option>
                {roleFilter !== 'STUDENT' && <option value="REJECTED">Bị từ chối</option>}
              </select>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96 flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width={15} height={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo họ tên, email..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs shrink-0"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-x-auto flex-1 min-h-0">
            {loading ? (
              <div className="h-full flex items-center justify-center py-24">
                <span className="w-8 h-8 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 sticky top-0 z-10">
                    {['Người dùng', 'Số điện thoại', 'Vai trò', 'Trạng thái', 'Ngày tham gia', 'Thao tác'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10px] font-bold tracking-widest text-slate-400 whitespace-nowrap uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const st = STATUS_MAP[u.status] ?? STATUS_MAP.ACTIVE
                    const rl = ROLE_MAP[u.role]
                    const initials = getInitials(u.fullName)

                    return (
                      <tr key={u.id} className="border-b border-slate-50 transition-colors hover:bg-indigo-50/10">
                        {/* Người dùng info */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shadow-2xs">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 leading-none">{u.fullName}</span>
                              <span className="text-[11px] text-slate-400 mt-1">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Số điện thoại */}
                        <td className="px-5 py-3.5 text-slate-600 text-xs font-medium">
                          {u.phone ?? '—'}
                        </td>

                        {/* Vai trò */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${rl.cls}`}>
                            {rl.label}
                          </span>
                        </td>

                        {/* Trạng thái */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${st.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>

                        {/* Ngày tham gia */}
                        <td className="px-5 py-3.5 text-slate-500 text-xs font-medium">
                          {formatDate(u.joinDate)}
                        </td>

                        {/* Thao tác */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {/* Chi tiết */}
                            <button
                              onClick={() => handleViewDetail(u)}
                              title="Xem chi tiết"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
                            >
                              <IconEye className="w-4 h-4" />
                            </button>

                            {/* Duyệt & Từ chối (chờ duyệt - role TEACHER) */}
                            {u.status === 'PENDING' && u.role === 'TEACHER' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(u.id, 'ACTIVE')}
                                  title="Duyệt tài khoản"
                                  className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-2xs"
                                >
                                  <IconCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setActionUserId(u.id)
                                    setActionType('REJECT')
                                    setNoteText('')
                                    setErrorMsg('')
                                  }}
                                  title="Từ chối phê duyệt"
                                  className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-colors shadow-2xs"
                                >
                                  <IconX className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Khôi phục duyệt (bị từ chối) */}
                            {u.status === 'REJECTED' && u.role === 'TEACHER' && (
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'PENDING')}
                                title="Mở lại yêu cầu phê duyệt"
                                className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors shadow-2xs"
                              >
                                <IconRotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {/* Khóa tài khoản */}
                            {u.status === 'ACTIVE' && u.id !== currentUser?.id && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Bạn có chắc chắn muốn khóa tài khoản này?')) {
                                    handleUpdateStatus(u.id, 'LOCKED', { lockReason: 'Khóa tài khoản bởi quản trị viên.' })
                                  }
                                }}
                                title="Khóa tài khoản"
                                className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors shadow-2xs"
                              >
                                <IconLock className="w-4 h-4" />
                              </button>
                            )}

                            {/* Mở khóa */}
                            {u.status === 'LOCKED' && (
                              <button
                                onClick={() => handleUpdateStatus(u.id, 'ACTIVE')}
                                title="Mở khóa tài khoản"
                                className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-2xs"
                              >
                                <IconUnlock className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}

                  {users.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-400 text-sm">
                        Không tìm thấy người dùng nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {!loading && total > 0 && (
            <div className="bg-slate-50/70 border-t border-slate-100 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 font-medium">
                  Hiển thị {Math.min(total, (page - 1) * limit + 1)} - {Math.min(total, page * limit)} trong tổng số {total} thành viên
                </span>
                
                {/* Limit Selector */}
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  <option value={10}>10 dòng</option>
                  <option value={20}>20 dòng</option>
                  <option value={50}>50 dòng</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-2xs"
                >
                  Trước
                </button>
                <span className="px-3 py-1 text-xs font-bold text-slate-700 bg-slate-200/50 rounded-lg">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-2xs"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Thông tin chi tiết tài khoản</h3>
                <p className="text-xs text-slate-400 mt-0.5">Mã số ID: #{selectedUser.id}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setUserDetail(null)
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail ? (
                <div className="py-12 flex items-center justify-center">
                  <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* General Profile Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Họ và tên</span>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{userDetail?.full_name ?? selectedUser.fullName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Địa chỉ Email</span>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{userDetail?.email ?? selectedUser.email}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Số điện thoại</span>
                      <p className="text-sm font-medium text-slate-700 mt-1">{userDetail?.phone ?? selectedUser.phone ?? 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phiên bản bảo mật (Auth Version)</span>
                      <p className="text-sm font-mono font-semibold text-slate-800 mt-1">{userDetail?.auth_version ?? selectedUser.authVersion}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vai trò</span>
                      <div className="mt-1">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${ROLE_MAP[selectedUser.role].cls}`}>
                          {ROLE_MAP[selectedUser.role].label}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Trạng thái</span>
                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_MAP[selectedUser.status].cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_MAP[selectedUser.status].dot}`} />
                          {STATUS_MAP[selectedUser.status].label}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ngày tạo tài khoản</span>
                      <p className="text-sm font-medium text-slate-700 mt-1">{formatDate(userDetail?.created_at ?? selectedUser.joinDate)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cập nhật lần cuối</span>
                      <p className="text-sm font-medium text-slate-700 mt-1">{formatDate(userDetail?.updated_at)}</p>
                    </div>
                  </div>

                  {/* Audit Logs / Reason notes */}
                  {userDetail?.lock_reason && selectedUser.status === 'LOCKED' && (
                    <div className="bg-red-50/50 border border-red-200/60 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider">Thông tin khóa tài khoản</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Người khóa</span>
                          <p className="text-xs font-semibold text-slate-800 mt-1">Admin ID #{userDetail.locked_by}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Thời điểm khóa</span>
                          <p className="text-xs font-semibold text-slate-800 mt-1">{formatDate(userDetail.locked_at)}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Lý do khóa</span>
                          <p className="text-xs text-slate-700 mt-1 bg-white border border-red-100 p-2.5 rounded-lg font-medium">{userDetail.lock_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {userDetail?.review_note && (selectedUser.status === 'ACTIVE' || selectedUser.status === 'REJECTED') && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Thông tin phê duyệt yêu cầu</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Người phê duyệt</span>
                          <p className="text-xs font-semibold text-slate-800 mt-1">Admin ID #{userDetail.reviewed_by}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời điểm phê duyệt</span>
                          <p className="text-xs font-semibold text-slate-800 mt-1">{formatDate(userDetail.reviewed_at)}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ghi chú phản hồi</span>
                          <p className="text-xs text-slate-700 mt-1 bg-white border border-slate-100 p-2.5 rounded-lg font-medium">{userDetail.review_note}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer / Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setUserDetail(null)
                }}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
              >
                Đóng
              </button>

              {/* Action buttons inside details modal */}
              {selectedUser.status === 'PENDING' && selectedUser.role === 'TEACHER' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedUser.id, 'ACTIVE')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                  >
                    Duyệt tài khoản
                  </button>
                  <button
                    onClick={() => {
                      setActionUserId(selectedUser.id)
                      setActionType('REJECT')
                      setNoteText('')
                      setErrorMsg('')
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                  >
                    Từ chối
                  </button>
                </>
              )}

              {selectedUser.status === 'REJECTED' && selectedUser.role === 'TEACHER' && (
                <button
                  onClick={() => handleUpdateStatus(selectedUser.id, 'PENDING')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  Khôi phục duyệt
                </button>
              )}

              {selectedUser.status === 'ACTIVE' && selectedUser.id !== currentUser?.id && (
                <button
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn khóa tài khoản này?')) {
                      handleUpdateStatus(selectedUser.id, 'LOCKED', { lockReason: 'Khóa tài khoản bởi quản trị viên.' })
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  Khóa tài khoản
                </button>
              )}

              {selectedUser.status === 'LOCKED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedUser.id, 'ACTIVE')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  Mở khóa tài khoản
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Interactive Audit / Note input Dialog (Reject) ── */}
      {actionType === 'REJECT' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                Yêu cầu lý do từ chối
              </h3>
              <button
                onClick={() => setActionType(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Lý do từ chối duyệt
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Nhập lý do từ chối đơn đăng ký làm Giảng viên này..."
                  rows={4}
                  className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-lg border border-red-200/40">
                  {errorMsg}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setActionType(null)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
              >
                Hủy
              </button>
              <button
                onClick={handleActionConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
