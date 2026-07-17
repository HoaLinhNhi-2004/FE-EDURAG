import { useState, useEffect } from 'react'
import { getAccessToken } from '@/utils/token'
import type { User } from '@/types'
import { SearchIcon, XIcon } from '@/components/ui/icons'

const API = import.meta.env.VITE_API_BASE_URL

const COURSES = [
  { id: 'CS101', name: 'Trí tuệ nhân tạo' },
  { id: 'CS102', name: 'Hệ thống thông minh' },
  { id: 'ML101', name: 'Học Máy & AI' },
  { id: 'DL201', name: 'Deep Learning' },
  { id: 'NLP301', name: 'NLP' },
  { id: 'CV401', name: 'Computer Vision' },
  { id: 'DS101', name: 'Khoa học Dữ liệu' },
]

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
function IconBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Đang hoạt động', cls: 'bg-emerald-100 text-emerald-700' },
  PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
  LOCKED: { label: 'Đã khóa', cls: 'bg-red-100 text-red-700' },
  REJECTED: { label: 'Bị từ chối', cls: 'bg-slate-200 text-slate-600' },
}

interface AssignModalProps {
  teacher: User
  onClose: () => void
  onAssigned: (updatedTeacher: User) => void
}

function AssignModal({ teacher, onClose, onAssigned }: AssignModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(teacher.assignedCourses ?? []))
  const [loading, setLoading] = useState(false)

  const toggleCourse = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const tok = getAccessToken()
      const res = await fetch(`${API}/admin/teachers/${teacher.id}/courses`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedCourses: Array.from(selected) }),
      })
      const data = await res.json()
      if (res.ok) onAssigned(data.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Gán môn phụ trách</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
            <XIcon width={20} height={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">
            Chọn các môn học mà giảng viên <strong className="text-slate-700">{teacher.fullName}</strong> được quyền tải tài liệu lên:
          </p>
          <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2">
            {COURSES.map(c => (
              <label key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selected.has(c.id)} 
                  onChange={() => toggleCourse(c.id)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">{c.name}</span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded ml-auto font-mono text-slate-500">{c.id}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200">
            Hủy
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function TeacherManagementPage() {
  const [teachers, setTeachers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [assignTarget, setAssignTarget] = useState<User | null>(null)

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const tok = getAccessToken()
        const res = await fetch(`${API}/admin/teachers`, { headers: { Authorization: `Bearer ${tok}` } })
        const data = await res.json()
        if (res.ok) setTeachers(data.data?.items ?? [])
      } finally {
        setLoading(false)
      }
    }
    fetchTeachers()
  }, [])

  const updateStatus = async (id: number, status: string) => {
    const tok = getAccessToken()
    const res = await fetch(`${API}/admin/teachers/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const data = await res.json()
      setTeachers(prev => prev.map(t => t.id === id ? { ...t, status: data.data.status, authVersion: data.data.authVersion } : t))
    }
  }

  const pendingCount = teachers.filter(t => t.status === 'PENDING').length

  const filtered = teachers.filter(t => {
    const matchSearch = t.fullName.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus
    return matchSearch && matchStatus
  })

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Chưa có'
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(isoString))
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Giảng viên</h1>
          <p className="text-sm text-slate-500 mt-1">Duyệt, khóa và phân công môn học cho giảng viên</p>
        </div>
      </div>

      {/* Banner */}
      {pendingCount > 0 && filterStatus !== 'PENDING' && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs">!</span>
            <p className="text-sm font-medium text-amber-800">
              Có {pendingCount} yêu cầu đăng ký đang chờ phê duyệt
            </p>
          </div>
          <button 
            onClick={() => setFilterStatus('PENDING')}
            className="px-4 py-1.5 rounded-lg border border-amber-300 bg-amber-100 text-amber-800 text-xs font-semibold hover:bg-amber-200 transition-colors"
          >
            Xem ngay
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
        {[
          { id: 'ALL', label: 'Tất cả' },
          { id: 'PENDING', label: `Chờ duyệt (${pendingCount})` },
          { id: 'ACTIVE', label: 'Hoạt động' },
          { id: 'LOCKED', label: 'Đã khóa' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterStatus === tab.id
                ? 'bg-white text-indigo-600 shadow border border-slate-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
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
                  {['GIẢNG VIÊN', 'KHOA / HỌC VỊ', 'NGÀY THAM GIA', 'SL TÀI LIỆU', 'TRẠNG THÁI', 'MÔN PHỤ TRÁCH', 'THAO TÁC'].map((h) => (
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
                          <span className="text-slate-700">{t.department || 'Chưa cập nhật'}</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">{t.academicTitle || 'Giảng viên'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-slate-600 font-medium">{formatDate(t.joinDate)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex min-w-[2rem] items-center justify-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {t.documentCount ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        {t.assignedCourses && t.assignedCourses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {t.assignedCourses.map(c => (
                              <span key={c} className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa gán môn</span>
                        )}
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
                              <button onClick={() => setAssignTarget(t)} title="Gán môn" className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
                                <IconBook className="w-5 h-5" />
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

      {assignTarget && (
        <AssignModal 
          teacher={assignTarget} 
          onClose={() => setAssignTarget(null)} 
          onAssigned={(updated) => {
            setTeachers(prev => prev.map(t => t.id === updated.id ? updated : t))
            setAssignTarget(null)
          }}
        />
      )}
    </div>
  )
}
