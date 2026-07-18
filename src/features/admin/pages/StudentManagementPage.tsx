/*
  StudentManagementPage
  - Purpose: Quản lý sinh viên dành cho ADMIN.
  - Features:
      • Hiển thị danh sách sinh viên (tên, MSV, khóa, trạng thái).
      • Tìm kiếm theo tên hoặc MSV.
      • Đặt lại mật khẩu (reset password).
      • Khóa / Mở khóa tài khoản.
      • Xóa sinh viên.
      • Import Excel (UI placeholder).
  - Data: Gọi API /admin/students (MSW mock).
*/
import { useState, useEffect } from 'react'
import { getAccessToken } from '@/utils/token'
import type { User } from '@/types'
import { SearchIcon } from '@/components/ui/icons'

const API = import.meta.env.VITE_API_BASE_URL

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
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
function IconKey({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  )
}
function IconUpload({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
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

// ─── Status badge map ─────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIVE: {
    label: 'Hoạt động',
    cls: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  LOCKED: {
    label: 'Đã khóa',
    cls: 'bg-red-100 text-red-600',
    dot: 'bg-red-500',
  },
  PENDING: {
    label: 'Chờ duyệt',
    cls: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function StudentManagementPage() {
  const [students, setStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [resetingId, setResetingId] = useState<number | null>(null)
  const [resetSuccessId, setResetSuccessId] = useState<number | null>(null)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const tok = getAccessToken()
        const res = await fetch(`${API}/admin/students`, {
          headers: { Authorization: `Bearer ${tok}` },
        })
        const data = await res.json()
        if (res.ok) setStudents(data.data?.items ?? [])
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  // Khóa / Mở khóa tài khoản
  const updateStatus = async (id: number, status: 'ACTIVE' | 'LOCKED') => {
    const tok = getAccessToken()
    const res = await fetch(`${API}/admin/students/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const data = await res.json()
      setStudents((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: data.data.status, authVersion: data.data.authVersion } : s
        )
      )
    }
  }

  // Đặt lại mật khẩu
  const resetPassword = async (id: number) => {
    setResetingId(id)
    try {
      const tok = getAccessToken()
      await fetch(`${API}/admin/students/${id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}` },
      })
      setResetSuccessId(id)
      setTimeout(() => setResetSuccessId(null), 2000)
    } finally {
      setResetingId(null)
    }
  }

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    return (
      s.fullName.toLowerCase().includes(q) ||
      (s.studentCode ?? '').toLowerCase().includes(q)
    )
  })

  const lockedCount = students.filter((s) => s.status === 'LOCKED').length

  /** Lấy khóa học (năm nhập học) từ MSV — VD: SV2021001234 → 2021 */
  const getCohort = (s: User) => {
    if (s.studentCode) {
      const match = s.studentCode.match(/\d{4}/)
      if (match) return match[0]
    }
    return '—'
  }

  /** Initials avatar */
  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Sinh viên</h1>
          <p className="text-sm text-slate-500 mt-1">Thêm mới hàng loạt, đặt lại mật khẩu và quản lý tài khoản</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
          <IconUpload className="w-4 h-4" />
          Import Excel
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-5 max-w-full">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc MSV..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
        />
      </div>

      {/* ── Table card ── */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <span className="w-8 h-8 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {['SINH VIÊN', 'MSV', 'KHÓA', 'TRẠNG THÁI', 'THAO TÁC'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest text-slate-400 whitespace-nowrap uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const st = STATUS_MAP[s.status] ?? STATUS_MAP.ACTIVE
                  const initials = getInitials(s.fullName)
                  const isResetting = resetingId === s.id
                  const justReset = resetSuccessId === s.id

                  return (
                    <tr
                      key={s.id}
                      className="border-b border-slate-50 transition-colors hover:bg-indigo-50/20"
                    >
                      {/* Sinh viên */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 leading-tight">{s.fullName}</span>
                            <span className="text-[11px] text-slate-400 mt-0.5">{s.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* MSV */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-semibold text-slate-700 text-[13px]">
                          {s.studentCode ?? '—'}
                        </span>
                      </td>

                      {/* Khóa */}
                      <td className="px-5 py-3.5">
                        <span className="text-slate-600">{getCohort(s)}</span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {/* Đặt lại MK */}
                          <button
                            onClick={() => resetPassword(s.id)}
                            disabled={isResetting}
                            title="Đặt lại mật khẩu"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
                          >
                            {justReset ? (
                              <>
                                <IconCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-600">Đã đặt</span>
                              </>
                            ) : (
                              <>
                                <IconKey className="w-3.5 h-3.5 text-slate-400" />
                                Đặt lại MK
                              </>
                            )}
                          </button>

                          {/* Khóa / Mở khóa */}
                          {s.status === 'ACTIVE' ? (
                            <button
                              onClick={() => updateStatus(s.id, 'LOCKED')}
                              title="Khóa tài khoản"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                            >
                              <IconLock className="w-3.5 h-3.5" />
                              Khóa
                            </button>
                          ) : (
                            <button
                              onClick={() => updateStatus(s.id, 'ACTIVE')}
                              title="Mở khóa tài khoản"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                            >
                              <IconUnlock className="w-3.5 h-3.5" />
                              Mở
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  )
                })}

                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400 text-sm">
                      Không tìm thấy sinh viên nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Footer summary ── */}
      {!loading && (
        <p className="mt-3 text-xs text-slate-400">
          {students.length} sinh viên{lockedCount > 0 && ` · ${lockedCount} đã khóa`}
        </p>
      )}

    </div>
  )
}
