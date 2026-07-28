import { useState, useEffect } from 'react'
import { getAccessToken } from '@/utils/token'
import type { User } from '@/types'
import { mapBackendUser, type RawUser } from '@/api/user.mapper'
import { SearchIcon } from '@/components/ui/icons'
import { PageHeader } from '@/components/ui'

const API = import.meta.env.VITE_API_BASE_URL

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
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

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Đang hoạt động', cls: 'bg-emerald-100 text-emerald-700' },
  PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
  LOCKED: { label: 'Đã khóa', cls: 'bg-red-100 text-red-700' },
  REJECTED: { label: 'Bị từ chối', cls: 'bg-slate-200 text-slate-600' },
}

export function TeacherManagementPage() {
  const [teachers, setTeachers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const tok = getAccessToken()
        const res = await fetch(`${API}/admin/users?role=TEACHER&limit=100`, { headers: { Authorization: `Bearer ${tok}` } })
        const data = await res.json()
        if (res.ok) {
          // BE trả snake_case — dùng mapBackendUser để chuẩn hóa về camelCase
          const rawUsers: RawUser[] = data.data?.users ?? []
          setTeachers(rawUsers.map((u) => mapBackendUser(u)!).filter(Boolean))
        }
      } finally {
        setLoading(false)
      }
    }
    fetchTeachers()
  }, [])

  const updateStatus = async (id: number, status: string) => {
    const tok = getAccessToken()

    // BE yêu cầu reviewNote khi REJECT và lockReason khi LOCK (không được rỗng)
    const payload: Record<string, string> = { status }
    if (status === 'REJECTED') {
      payload.reviewNote = 'Từ chối duyệt tài khoản giảng viên.'
    } else if (status === 'LOCKED') {
      payload.lockReason = 'Khóa tài khoản bởi quản trị viên.'
    }

    const res = await fetch(`${API}/admin/users/${id}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json()
      // BE trả user object đầy đủ trong data.data — map lại để cập nhật state
      const updated = mapBackendUser(data.data as RawUser)
      if (updated) {
        setTeachers((prev) => prev.map((t) => (t.id === id ? updated : t)))
      }
    }
  }

  const pendingCount = teachers.filter(t => t.status === 'PENDING').length

  const filtered = teachers.filter((t) => {
    const name = t.fullName ?? ''
    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus
    return matchSearch && matchStatus
  })

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Chưa có'
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(isoString))
  }

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden bg-slate-50">
      <PageHeader
        title="Quản lý Giảng viên"
        subtitle="Duyệt và khóa tài khoản giảng viên trong hệ thống"
      />
      <div className="flex-1 min-h-0 overflow-y-auto p-6 animate-fade-in">

      {/* Banner */}
      {pendingCount > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Yêu cầu đăng ký mới</p>
              <p className="text-xs text-amber-600 mt-0.5">Hiện đang có {pendingCount} giảng viên đang chờ được duyệt tài khoản.</p>
            </div>
          </div>
          <button 
            onClick={() => setFilterStatus('PENDING')} 
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            Xem yêu cầu
          </button>
        </div>
      )}

      {/* Toolbar: Filter tabs & Search aligned */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl overflow-x-auto shrink-0">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PENDING', label: `Chờ duyệt${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            { id: 'ACTIVE', label: 'Đang hoạt động' },
            { id: 'LOCKED', label: 'Đã khóa' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72 md:w-80">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={16} height={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {['GIẢNG VIÊN', 'KHOA / HỌC VỊ', 'NGÀY THAM GIA', 'TRẠNG THÁI', 'THAO TÁC'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest text-slate-400 whitespace-nowrap uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const st = STATUS_MAP[t.status] || STATUS_MAP.PENDING
                  return (
                    <tr key={t.id} className={`border-b border-slate-50 transition-colors hover:bg-slate-50/50 ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{t.fullName}</span>
                          <span className="text-xs text-slate-500 mt-0.5">{t.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">{t.department ?? 'CNTT'}</span>
                          <span className="text-xs text-slate-400 mt-0.5">{t.degree ?? 'Thạc sĩ'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 font-medium">
                        {formatDate(t.joinDate)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {t.status === 'PENDING' && (
                            <>
                              <button onClick={() => updateStatus(t.id, 'ACTIVE')} title="Duyệt" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                                <IconCheck className="w-5 h-5" />
                              </button>
                              <button onClick={() => updateStatus(t.id, 'REJECTED')} title="Từ chối" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                <IconX className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {t.status === 'ACTIVE' && (
                            <>
                              <button onClick={() => updateStatus(t.id, 'LOCKED')} title="Khóa tài khoản" className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors">
                                <IconLock className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {t.status === 'LOCKED' && (
                            <button onClick={() => updateStatus(t.id, 'ACTIVE')} title="Mở khóa" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                              <IconUnlock className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      Không tìm thấy giảng viên nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
