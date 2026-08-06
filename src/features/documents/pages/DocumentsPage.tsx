import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react'
import { useAuth } from '@/store/auth'
import { getAccessToken } from '@/utils/token'
import type { CourseDocument } from '@/types'
import { PageHeader, Alert } from '@/components/ui'
import {
  CloudUploadIcon, XIcon, UploadIcon, SearchIcon, TrashIcon,
  EyeIcon, EyeOffIcon, DownloadIcon, FileTextIcon,
  GridIcon, ListIcon, ImageIcon,
} from '@/components/ui/icons'

const API = import.meta.env.VITE_API_BASE_URL

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtSize(bytes: number) {
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + ' MB'
  return (bytes / 1024).toFixed(0) + ' KB'
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fileExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}


const ALLOWED_EXT = ['pdf', 'docx', 'pptx']
const MAX_BYTES = 50 * 1024 * 1024

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ready:   { label: 'Hoạt động', cls: 'bg-emerald-100 text-emerald-700' },
  queued:  { label: 'Hàng chờ',  cls: 'bg-amber-100 text-amber-700' },
  uploaded:{ label: 'Đã tải lên', cls: 'bg-indigo-100 text-indigo-700' },
  processing:{ label: 'Đang xử lý',cls: 'bg-blue-100 text-blue-700' },
  failed:  { label: 'Lỗi',       cls: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Đã hủy',   cls: 'bg-slate-100 text-slate-700' },
}

function mapBackendDocument(d: any): CourseDocument {
  // Hiển thị theo `title`; KHÔNG fallback về tên file gốc vì tên file có thể sai encoding.
  const docTitle = d.title ?? 'Tài liệu môn học'
  const docName = d.originalFilename ?? d.original_filename ?? d.title ?? 'Tài liệu'

  return {
    id: d.id,
    name: docName,
    fileType: (d.fileType ?? d.file_type ?? 'pdf').toLowerCase() as any,
    courseId: '',
    courseName: 'Môn học chung',
    sizeBytes: d.fileSize ?? d.fileSizeBytes ?? d.file_size_bytes ?? 0,
    status: (d.processingStatus ?? d.processing_status ?? 'ready').toLowerCase() as any,
    hidden: (d.visibilityStatus ?? d.visibility_status) === 'HIDDEN',
    uploadedBy: String(d.uploadedBy ?? d.uploaded_by ?? ''),
    uploadedAt: d.createdAt ?? d.created_at ?? new Date().toISOString(),
    currentVersion: d.currentVersion ?? 1,
    title: docTitle,
    author: d.author ?? 'Giảng viên',
    docType: d.fileType ? `${d.fileType.toUpperCase()} Document` : 'Tài liệu',
    publishYear: undefined,
    abstract: d.description ?? d.abstract ?? '',
  }
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
interface UploadModalProps { onClose: () => void; onUploaded: (doc: CourseDocument) => void }

function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const token = getAccessToken()
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [abstract, setAbstract] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function pickFile(f: File) {
    setError('')
    const ext = fileExt(f.name)
    if (!ALLOWED_EXT.includes(ext)) { setError('Chỉ chấp nhận PDF, DOCX, PPTX.'); return }
    if (f.size > MAX_BYTES) { setError('File vượt quá 50 MB.'); return }
    setFile(f)
  }

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }, [])

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) pickFile(f)
  }

  async function handleUpload() {
    if (!file) { setError('Vui lòng chọn file.'); return }
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (title.trim()) fd.append('title', title.trim())
      if (author.trim()) fd.append('author', author.trim())
      if (abstract.trim()) fd.append('description', abstract.trim())
      
      const res = await fetch(`${API}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const json = await res.json()
      // BE trả 202 khi upload thành công; 503 khi RAG dispatch thất bại
      if (!res.ok) { setError(json.message ?? 'Upload thất bại.'); return }
      // BE trả { document, job, previewJob } trong data
      onUploaded(mapBackendDocument(json.data.document))
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally { setLoading(false) }
  }

  function onBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)' }}
      onClick={onBackdrop}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col gap-5 p-7 animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Tải lên tài liệu mới</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <XIcon width={20} height={20} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-10 cursor-pointer transition-all select-none ${
            dragging ? 'border-indigo-400 bg-indigo-50' : file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40'
          }`}
        >
          <input ref={fileRef} type="file" accept=".pdf,.docx,.pptx" className="hidden" onChange={onInputChange} />
          <CloudUploadIcon width={44} height={44} className={file ? 'text-emerald-500' : 'text-indigo-400'} />
          {file ? (
            <>
              <p className="text-sm font-semibold text-emerald-700">{file.name}</p>
              <p className="text-xs text-slate-400">{fmtSize(file.size)}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Kéo thả file hoặc{' '}
                <span className="text-indigo-600 font-semibold">chọn từ máy tính</span>
              </p>
              <p className="text-xs text-slate-400">PDF, DOCX, PPTX – Tối đa 50 MB</p>
            </>
          )}
        </div>

        {/* Metadata fields */}
        <div className="grid grid-cols-2 gap-4 max-h-[55vh] overflow-y-auto pr-1">

          {/* Tên tài liệu */}
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Tên tài liệu</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên hiển thị của tài liệu (để trống sẽ dùng tên file)"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Tác giả */}
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Tác giả</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="VD: Nguyễn Văn A, Trần Thị B"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Mô tả / Tóm tắt */}
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Mô tả tài liệu</label>
            <textarea
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Mô tả ngắn nội dung, phạm vi sử dụng của tài liệu..."
              rows={3}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Hủy
          </button>
          <button
            onClick={handleUpload}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition-colors shadow"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadIcon width={16} height={16} />
            )}
            {loading ? 'Đang tải lên…' : 'Tải lên'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
function DeleteConfirmDialog({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <TrashIcon width={18} height={18} className="text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Xoá tài liệu?</p>
            <p className="text-sm text-slate-500 mt-0.5">Tài liệu <span className="font-medium text-slate-700">"{name}"</span> sẽ bị xoá vĩnh viễn.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Hủy</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Xoá</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const CARD_PALETTES = [
  { bg: 'bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-indigo-50/20', text: 'text-indigo-600' },
  { bg: 'bg-gradient-to-br from-sky-50/90 via-blue-50/50 to-sky-50/20', text: 'text-sky-600' },
  { bg: 'bg-gradient-to-br from-teal-50/90 via-cyan-50/50 to-teal-50/20', text: 'text-teal-600' },
  { bg: 'bg-gradient-to-br from-purple-50/90 via-fuchsia-50/50 to-purple-50/20', text: 'text-purple-600' },
  { bg: 'bg-gradient-to-br from-rose-50/90 via-pink-50/50 to-rose-50/20', text: 'text-rose-600' },
]

export function DocumentsPage() {
  const { user } = useAuth()
  const canManage = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  const [docs, setDocs] = useState<CourseDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [showUpload, setShowUpload] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CourseDocument | null>(null)

  useEffect(() => {
    const tok = getAccessToken()
    const endpoint = canManage ? `${API}/documents` : `${API}/library/documents`
    fetch(endpoint, { headers: { Authorization: `Bearer ${tok}` } })
      .then((r) => r.json())
      .then((j) => {
        // BE trả { documents[], total, page, limit } hoặc { items[], ... } trong data
        const rawDocs: any[] = j.data?.documents ?? j.data?.items ?? (Array.isArray(j.data) ? j.data : [])
        const mapped = rawDocs.map(mapBackendDocument)
        setDocs(canManage ? mapped : mapped.filter((d) => !d.hidden))
      })
      .catch(() => { /* ignore network errors on mount */ })
      .finally(() => setLoading(false))
  }, [canManage])

  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [visibilityError, setVisibilityError] = useState<string | null>(null)

  function handleDownload(doc: CourseDocument) {
    const tok = getAccessToken()
    const fileUrl = canManage
      ? `${API}/documents/${doc.id}/file`
      : `${API}/library/documents/${doc.id}/download`
    
    setDownloadError(null)
    fetch(fileUrl, { headers: { Authorization: `Bearer ${tok}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed')
        return res.blob()
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.title ?? doc.name ?? 'document'
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      })
      .catch(() => setDownloadError('Không tải được file tài liệu. Vui lòng thử lại sau.'))
  }

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase()
    return d.name.toLowerCase().includes(q) || d.courseName.toLowerCase().includes(q) || (d.docType ?? '').toLowerCase().includes(q) || (d.author ?? '').toLowerCase().includes(q) || (d.title ?? '').toLowerCase().includes(q)
  })

  const activeCount = docs.filter((d) => !d.hidden).length
  const hiddenCount = docs.filter((d) => d.hidden).length

  /**
   * Ẩn/hiện tài liệu.
   * KHÔNG đọc document từ thân response: `data.document` là shape của endpoint
   * upload (DocumentUploadResponse), còn hide/unhide chỉ cam kết SuccessResponse
   * chung — đọc `j.data.document` sẽ ra undefined và ném lỗi, khiến nút bấm như
   * không có tác dụng cho tới khi F5.
   * BE cũng xử lý bất đồng bộ (202 + job SET_RETRIEVAL) nên refetch ngay có thể
   * đọc phải trạng thái cũ; vì vậy cập nhật lạc quan tại chỗ và chỉ hoàn tác khi
   * request thất bại.
   */
  async function toggleVisibility(doc: CourseDocument) {
    if (!canManage) return
    const nextHidden = !doc.hidden
    const action = nextHidden ? 'hide' : 'unhide'

    setVisibilityError(null)
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, hidden: nextHidden } : d)))

    try {
      const tok = getAccessToken()
      const res = await fetch(`${API}/documents/${doc.id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (!res.ok) throw new Error(`${action} failed: ${res.status}`)
    } catch {
      // Hoàn tác để giao diện không báo sai trạng thái so với BE.
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, hidden: doc.hidden } : d)))
      setVisibilityError(
        nextHidden
          ? 'Không ẩn được tài liệu. Vui lòng thử lại.'
          : 'Không hiện lại được tài liệu. Vui lòng thử lại.',
      )
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || !canManage) return
    const tok = getAccessToken()
    const res = await fetch(`${API}/documents/${deleteTarget.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tok}` },
    })
    if (res.ok) setDocs((prev) => prev.filter((d) => d.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const extColor: Record<string, string> = {
    pdf: 'bg-red-50 text-red-600 border-red-100',
    pptx: 'bg-orange-50 text-orange-600 border-orange-100',
    docx: 'bg-blue-50 text-blue-600 border-blue-100',
  }

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden bg-slate-50">
      <style>{`
        @keyframes modal-in { from { opacity:0; transform:scale(.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .animate-modal-in { animation: modal-in .2s ease-out; }
      `}</style>

      <PageHeader
        title={canManage ? 'Quản lý Học liệu' : 'Thư viện Tài liệu'}
        subtitle={canManage ? 'Tải lên, ẩn/hiện và xóa tài liệu môn học' : 'Danh sách tài liệu học tập & tham khảo môn học'}
      />

      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {downloadError && (
          <Alert variant="error" className="flex items-center justify-between">
            <span>{downloadError}</span>
            <button onClick={() => setDownloadError(null)} className="ml-4 font-bold text-red-600 hover:text-red-800 text-xs">✕</button>
          </Alert>
        )}

        {visibilityError && (
          <Alert variant="error" className="flex items-center justify-between">
            <span>{visibilityError}</span>
            <button onClick={() => setVisibilityError(null)} className="ml-4 font-bold text-red-600 hover:text-red-800 text-xs">✕</button>
          </Alert>
        )}

        {/* ── Toolbar: Search & Action Buttons & View Mode ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <SearchIcon width={16} height={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm tài liệu..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-xs transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* View Switcher */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setViewMode('grid')}
                title="Dạng thẻ"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <GridIcon width={15} height={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Dạng bảng"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <ListIcon width={15} height={15} />
              </button>
            </div>

            {canManage && (
              <button
                id="btn-upload-doc"
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <UploadIcon width={14} height={14} />
                <span>+ Tải lên tài liệu</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Content View (Grid or Table) ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs text-slate-400">
            <FileTextIcon width={40} height={40} />
            <p className="text-sm">{search ? 'Không tìm thấy tài liệu phù hợp' : 'Chưa có tài liệu nào trong thư viện.'}</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── GRID CARD VIEW ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((doc, idx) => {
              const palette = CARD_PALETTES[idx % CARD_PALETTES.length]

              return (
                <div
                  key={doc.id}
                  className={`group flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden ${doc.hidden ? 'opacity-60' : ''}`}
                >
                  {/* Top Pastel Banner */}
                  <div className={`h-40 p-4 ${palette.bg} flex flex-col justify-between relative border-b border-slate-100/60`}>
                    {/* Top Row: Format badge & Status badge */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase bg-white/90 shadow-2xs ${extColor[doc.fileType] ?? 'text-slate-600 border-slate-200'}`}>
                        {doc.fileType}
                      </span>
                      {(() => {
                        const st = STATUS_MAP[doc.status] ?? { label: doc.status, cls: 'bg-slate-100 text-slate-600' }
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-2xs ${st.cls}`}>
                            {doc.hidden ? 'Đã ẩn' : st.label}
                          </span>
                        )
                      })()}
                    </div>

                    {/* Center Icon & Category */}
                    <div className="flex flex-col items-center justify-center my-auto">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-xs border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                        <ImageIcon width={22} height={22} className={palette.text} />
                      </div>
                      {doc.docType && (
                        <span className={`text-xs font-semibold mt-2 ${palette.text}`}>
                          {doc.docType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors" title={doc.title ?? doc.name}>
                        {doc.title ?? doc.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {doc.courseName}
                      </p>
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-400">
                        Cập nhật {fmtDate(doc.uploadedAt)}
                      </span>

                      <div className="flex items-center gap-2">
                        {canManage && (
                          <>
                            <button
                              title={doc.hidden ? 'Hiện tài liệu' : 'Ẩn tài liệu'}
                              onClick={() => toggleVisibility(doc)}
                              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              {doc.hidden ? <EyeIcon width={14} height={14} /> : <EyeOffIcon width={14} height={14} />}
                            </button>
                            <button
                              title="Xoá tài liệu"
                              onClick={() => setDeleteTarget(doc)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <TrashIcon width={14} height={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDownload(doc)}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 transition-colors text-xs ml-1"
                        >
                          Tải xuống <DownloadIcon width={13} height={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ── TABLE VIEW ── */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Bảng 7 cột, header whitespace-nowrap → màn hẹp phải cuộn ngang được,
                nếu không các cột bị bóp nát hoặc cắt cụt bởi overflow-hidden ở ngoài. */}
            <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {['TÊN TÀI LIỆU', 'MÔN HỌC', 'LOẠI / TÁC GIẢ', 'KÍCH THƯỚC', 'CẬP NHẬT', 'TRẠNG THÁI', 'THAO TÁC'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, i) => {
                  const st = STATUS_MAP[doc.status] ?? { label: doc.status, cls: 'bg-slate-100 text-slate-600' }
                  return (
                    <tr
                      key={doc.id}
                      className={`border-b border-slate-50 transition-colors hover:bg-indigo-50/30 ${doc.hidden ? 'opacity-60' : ''} ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                    >
                      {/* Name + title */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="flex items-center gap-2.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${extColor[doc.fileType] ?? 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                            {doc.fileType}
                          </span>
                          <span className="truncate font-medium text-slate-800 text-xs" title={doc.title ?? doc.name}>
                            {doc.title ?? doc.name}
                          </span>
                        </div>
                        {doc.abstract && (
                          <p className="text-[11px] text-slate-400 mt-1 ml-8 line-clamp-1">{doc.abstract}</p>
                        )}
                      </td>

                      {/* Course */}
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{doc.courseName}</td>

                      {/* Type / Author */}
                      <td className="px-4 py-3">
                        {doc.docType && <p className="text-xs text-slate-700 font-medium">{doc.docType}</p>}
                        {doc.author && <p className="text-[11px] text-slate-400 mt-0.5">{doc.author}</p>}
                        {doc.publishYear && <p className="text-[11px] text-slate-400">{doc.publishYear}</p>}
                      </td>

                      {/* Size */}
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{fmtSize(doc.sizeBytes)}</td>

                      {/* Date */}
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{fmtDate(doc.uploadedAt)}</td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.cls}`}>
                          {doc.hidden ? 'Đã ẩn' : st.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {canManage && (
                            <button
                              title={doc.hidden ? 'Hiện tài liệu' : 'Ẩn tài liệu'}
                              onClick={() => toggleVisibility(doc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              {doc.hidden ? <EyeIcon width={15} height={15} /> : <EyeOffIcon width={15} height={15} />}
                            </button>
                          )}
                          <button
                            title="Tải xuống"
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <DownloadIcon width={15} height={15} />
                          </button>
                          {canManage && (
                            <button
                              title="Xoá"
                              onClick={() => setDeleteTarget(doc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <TrashIcon width={15} height={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* ── Footer stats ── */}
        {!loading && docs.length > 0 && (
          <p className="text-xs text-slate-400">
            {docs.length} tài liệu &bull; {activeCount} đang hoạt động &bull; {hiddenCount} đã ẩn
          </p>
        )}
      </div>

      {/* ── Modals ── */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={(doc) => { setDocs((prev) => [doc, ...prev]); setShowUpload(false) }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmDialog
          name={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      </div>
    </div>
  )
}
