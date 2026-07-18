import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react'
import { useAuth } from '@/store/auth'
import { getAccessToken } from '@/utils/token'
import type { CourseDocument } from '@/types'
import {
  CloudUploadIcon, XIcon, UploadIcon, SearchIcon, TrashIcon,
  EyeIcon, EyeOffIcon, DownloadIcon, FileTextIcon,
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

const COURSES = [
  { id: 'ML101', name: 'Học Máy & AI' },
  { id: 'DL201', name: 'Deep Learning' },
  { id: 'NLP301', name: 'NLP' },
  { id: 'CV401', name: 'Computer Vision' },
  { id: 'DS101', name: 'Khoa học Dữ liệu' },
]
const DOC_TYPES = [
  'Giáo trình',
  'Bài giảng / Slide',
  'Đề thi / Đáp án',
  'Bài báo khoa học',
  'Đồ án / Báo cáo mẫu',
  'Tài liệu tham khảo',
]
const ALLOWED_EXT = ['pdf', 'docx', 'pptx']
const MAX_BYTES = 50 * 1024 * 1024

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ready:   { label: 'Hoạt động', cls: 'bg-emerald-100 text-emerald-700' },
  queued:  { label: 'Hàng chờ',  cls: 'bg-amber-100 text-amber-700' },
  indexing:{ label: 'Đang xử lý',cls: 'bg-blue-100 text-blue-700' },
  ocr:     { label: 'OCR',       cls: 'bg-blue-100 text-blue-700' },
  parsing: { label: 'Parsing',   cls: 'bg-blue-100 text-blue-700' },
  failed:  { label: 'Lỗi',       cls: 'bg-red-100 text-red-700' },
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
interface UploadModalProps { onClose: () => void; onUploaded: (doc: CourseDocument) => void }

function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const token = getAccessToken()
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [courseId, setCourseId] = useState(COURSES[0].id)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [docType, setDocType] = useState('')
  const [publishYear, setPublishYear] = useState('')
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
      fd.append('courseId', courseId)
      if (title.trim()) fd.append('title', title.trim())
      if (author.trim()) fd.append('author', author.trim())
      if (docType) fd.append('docType', docType)
      if (publishYear.trim()) fd.append('publishYear', publishYear.trim())
      if (abstract.trim()) fd.append('abstract', abstract.trim())
      const res = await fetch(`${API}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? 'Upload thất bại.'); return }
      onUploaded(json.data)
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.')
    } finally { setLoading(false) }
  }

  // close on backdrop click
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

          {/* Môn học */}
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Môn học <span className="text-red-500">*</span></label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {COURSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

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

          {/* Loại tài liệu + Năm xuất bản */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Loại tài liệu</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">-- Chọn loại --</option>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Năm xuất bản</label>
            <input
              value={publishYear}
              onChange={(e) => setPublishYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="VD: 2024"
              inputMode="numeric"
              maxLength={4}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Tóm tắt */}
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Tóm tắt nội dung</label>
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
export function DocumentsPage() {
  useAuth() // ensure authenticated context
  const [docs, setDocs] = useState<CourseDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CourseDocument | null>(null)

  useEffect(() => {
    const tok = getAccessToken()
    fetch(`${API}/documents`, { headers: { Authorization: `Bearer ${tok}` } })
      .then((r) => r.json())
      .then((j) => setDocs(j.data?.items ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase()
    return d.name.toLowerCase().includes(q) || d.courseName.toLowerCase().includes(q) || (d.docType ?? '').toLowerCase().includes(q) || (d.author ?? '').toLowerCase().includes(q)
  })

  const activeCount = docs.filter((d) => !d.hidden).length
  const hiddenCount = docs.filter((d) => d.hidden).length

  async function toggleVisibility(doc: CourseDocument) {
    const tok = getAccessToken()
    const res = await fetch(`${API}/documents/${doc.id}/visibility`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hidden: !doc.hidden }),
    })
    const j = await res.json()
    if (res.ok) setDocs((prev) => prev.map((d) => (d.id === doc.id ? j.data : d)))
  }

  async function confirmDelete() {
    if (!deleteTarget) return
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
    <>
      <style>{`
        @keyframes modal-in { from { opacity:0; transform:scale(.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .animate-modal-in { animation: modal-in .2s ease-out; }
      `}</style>

      <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6 min-h-screen">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Học liệu</h1>
            <p className="text-sm text-slate-500 mt-0.5">Tải lên, cập nhật và quản lý tài liệu môn học</p>
          </div>
          <button
            id="btn-upload-doc"
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition-colors"
          >
            <UploadIcon width={16} height={16} />
            + Tải lên tài liệu
          </button>
        </div>

        {/* ── Search ── */}
        <div className="relative">
          <SearchIcon width={16} height={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm tài liệu..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
          />
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <span className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
              <FileTextIcon width={40} height={40} />
              <p className="text-sm">{search ? 'Không tìm thấy tài liệu phù hợp' : 'Chưa có tài liệu nào. Hãy tải lên tài liệu đầu tiên!'}</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {['TÊN TÀI LIỆU', 'MÔN HỌC', 'LOẠI / TÁC GIẢ', 'KÍCH THƯỚC', 'CẬP NHẬT', 'TRẠNG THÁI', 'THAO TÁC'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, i) => {
                  const ext = fileExt(doc.name)
                  const st = STATUS_MAP[doc.status] ?? { label: doc.status, cls: 'bg-slate-100 text-slate-600' }
                  return (
                    <tr
                      key={doc.id}
                      className={`border-b border-slate-50 transition-colors hover:bg-indigo-50/30 ${doc.hidden ? 'opacity-60' : ''} ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                    >
                      {/* Name + title */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="flex items-center gap-2.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${extColor[ext] ?? 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                            {ext}
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
                          <button
                            title={doc.hidden ? 'Hiện tài liệu' : 'Ẩn tài liệu'}
                            onClick={() => toggleVisibility(doc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            {doc.hidden ? <EyeIcon width={15} height={15} /> : <EyeOffIcon width={15} height={15} />}
                          </button>
                          <button
                            title="Tải xuống"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <DownloadIcon width={15} height={15} />
                          </button>
                          <button
                            title="Xoá"
                            onClick={() => setDeleteTarget(doc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <TrashIcon width={15} height={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

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
    </>
  )
}
