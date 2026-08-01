import { useState, useCallback, useEffect, useRef } from 'react'
import { getAccessToken } from '@/utils/token'
import type { CourseDocument } from '@/types'
import { PageHeader, Alert } from '@/components/ui'
import {
  SearchIcon, DownloadIcon, FileTextIcon,
  GridIcon, ListIcon, ImageIcon, ChevronDownIcon,
} from '@/components/ui/icons'

const API = import.meta.env.VITE_API_BASE_URL

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtSize(bytes: number) {
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + ' MB'
  return (bytes / 1024).toFixed(0) + ' KB'
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function mapLibraryDocument(d: any): CourseDocument {
  return {
    id: d.id,
    name: d.originalFilename ?? d.original_filename ?? d.title ?? 'Tài liệu',
    fileType: (d.fileType ?? d.file_type ?? 'pdf').toLowerCase() as any,
    courseId: '',
    courseName: 'Môn học chung',
    sizeBytes: d.fileSize ?? d.fileSizeBytes ?? d.file_size_bytes ?? 0,
    status: 'ready',
    hidden: false,
    uploadedBy: String(d.uploadedBy ?? d.uploaded_by ?? ''),
    uploadedAt: d.createdAt ?? d.created_at ?? new Date().toISOString(),
    currentVersion: d.currentVersion ?? 1,
    // Hiển thị theo `title`; KHÔNG fallback về tên file gốc vì tên file có thể sai encoding.
    title: d.title ?? 'Tài liệu',
    author: d.author ?? 'Giảng viên',
    docType: d.fileType ? `${d.fileType.toUpperCase()} Document` : 'Tài liệu',
    publishYear: undefined,
    abstract: d.description ?? d.abstract ?? '',
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CARD_PALETTES = [
  { bg: 'bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-indigo-50/20', text: 'text-indigo-600' },
  { bg: 'bg-gradient-to-br from-sky-50/90 via-blue-50/50 to-sky-50/20', text: 'text-sky-600' },
  { bg: 'bg-gradient-to-br from-teal-50/90 via-cyan-50/50 to-teal-50/20', text: 'text-teal-600' },
  { bg: 'bg-gradient-to-br from-purple-50/90 via-fuchsia-50/50 to-purple-50/20', text: 'text-purple-600' },
  { bg: 'bg-gradient-to-br from-rose-50/90 via-pink-50/50 to-rose-50/20', text: 'text-rose-600' },
  { bg: 'bg-gradient-to-br from-amber-50/90 via-yellow-50/50 to-amber-50/20', text: 'text-amber-600' },
]

const EXT_COLOR: Record<string, string> = {
  pdf: 'bg-red-50 text-red-600 border-red-100',
  pptx: 'bg-orange-50 text-orange-600 border-orange-100',
  docx: 'bg-blue-50 text-blue-600 border-blue-100',
}

type SortOption = 'newest' | 'oldest' | 'title_asc' | 'title_desc'
type FileTypeFilter = '' | 'pdf' | 'docx' | 'txt'

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Mới nhất',
  oldest: 'Cũ nhất',
  title_asc: 'Tên A→Z',
  title_desc: 'Tên Z→A',
}

const PAGE_LIMIT = 12

/**
 * UC Library — Thư viện học liệu công khai (read-only).
 * Server luôn scope: READY + VISIBLE + chưa xóa.
 * Params: q (OR title/description/author), fileType AND, sort (newest|oldest|title_asc|title_desc), page+limit.
 * Client KHÔNG filter: owner, processing, visibility, preview, job state.
 */
export function LibraryPage() {
  // ── Server-driven state ────────────────────────────────────────────────────
  const [docs, setDocs] = useState<CourseDocument[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Query params (server-side) ─────────────────────────────────────────────
  const [q, setQ] = useState('')                          // pending input (debounced)
  const [committedQ, setCommittedQ] = useState('')        // actually sent to server
  const [fileType, setFileType] = useState<FileTypeFilter>('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [page, setPage] = useState(1)

  // ── UI-only state ──────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  // ── Preview modal state ───────────────────────────────────────────────────
  const [previewDoc, setPreviewDoc] = useState<CourseDocument | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // ── Close sort dropdown on outside click ───────────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // ── Debounce q input → commit after 400ms ─────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => {
      setCommittedQ(q)
      setPage(1) // reset to first page on new search
    }, 400)
    return () => clearTimeout(id)
  }, [q])

  // ── Reset page when filter/sort changes ────────────────────────────────────
  useEffect(() => { setPage(1) }, [fileType, sort])

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    setError(null)

    const tok = getAccessToken()
    const params = new URLSearchParams()

    // q — searches OR in title/description/author (%, _, \ treated as literal by server)
    if (committedQ.trim()) params.set('q', committedQ.trim())

    // fileType AND filter (pdf | docx | txt)
    if (fileType) params.set('fileType', fileType.toUpperCase())

    // Pagination
    params.set('page', String(page))
    params.set('limit', String(PAGE_LIMIT))

    // Sort with id tie-breaker handled server-side
    params.set('sort', sort)

    const url = `${API}/library/documents?${params.toString()}`
    fetch(url, { headers: tok ? { Authorization: `Bearer ${tok}` } : {} })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((j) => {
        const raw: any[] = j.data?.documents ?? j.data?.items ?? (Array.isArray(j.data) ? j.data : [])
        setDocs(raw.map(mapLibraryDocument))
        setTotal(j.data?.total ?? raw.length)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [committedQ, fileType, sort, page])

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = useCallback((doc: CourseDocument) => {
    const tok = getAccessToken()
    setDownloadError(null)
    fetch(`${API}/library/documents/${doc.id}/source`, {
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    })
      .then(async (res) => {
        if (res.status === 409) throw new Error('ORIGINAL_SOURCE_UNAVAILABLE')
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
      .catch((e: Error) => {
        if (e.message === 'ORIGINAL_SOURCE_UNAVAILABLE') {
          setDownloadError('File gốc hiện không khả dụng (ORIGINAL_SOURCE_UNAVAILABLE).')
        } else {
          setDownloadError('Không tải được file tài liệu. Vui lòng thử lại sau.')
        }
      })
  }, [])

  // ── Preview ────────────────────────────────────────────────────────────────
  const openPreview = useCallback((doc: CourseDocument) => {
    setPreviewUrl(prev => { if (prev) window.URL.revokeObjectURL(prev); return null })
    setPreviewDoc(doc)
    setPreviewError(null)
    setPreviewLoading(true)
    const tok = getAccessToken()
    fetch(`${API}/library/documents/${doc.id}/preview`, {
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    })
      .then(async (res) => {
        if (res.status === 404) throw new Error('NOT_FOUND')
        if (res.status === 409) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j.errorCode ?? 'PREVIEW_NOT_READY')
        }
        if (!res.ok) throw new Error('PREVIEW_FAILED')
        return res.blob()
      })
      .then((blob) => setPreviewUrl(window.URL.createObjectURL(blob)))
      .catch((e: Error) => {
        if (e.message === 'NOT_FOUND') {
          setPreviewError('Tài liệu không tồn tại hoặc không khả dụng.')
        } else if (e.message === 'PREVIEW_NOT_READY' || e.message === 'PREVIEW_UNAVAILABLE') {
          setPreviewError('Preview chưa sẵn sàng hoặc không khả dụng. Tài liệu này đang chờ xử lý hoặc chưa hỗ trợ xem trước.')
        } else {
          setPreviewError('Không tải được xem trước. Vui lòng thử lại sau.')
        }
      })
      .finally(() => setPreviewLoading(false))
  }, [])

  const closePreview = useCallback(() => {
    setPreviewDoc(null)
    setPreviewUrl(prev => { if (prev) window.URL.revokeObjectURL(prev); return null })
    setPreviewError(null)
  }, [])

  // ── Pagination helpers ─────────────────────────────────────────────────────
  const totalPages = Math.ceil(total / PAGE_LIMIT) || 1

  // ── Pill helper ────────────────────────────────────────────────────────────
  function pillCls(active: boolean) {
    return active
      ? 'bg-indigo-600 text-white shadow-xs'
      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
  }

  const hasActiveFilters = committedQ.trim() !== '' || fileType !== ''

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden bg-slate-50">
      <PageHeader
        title="Thư viện học liệu"
        subtitle="Tài liệu READY và công khai — tìm kiếm theo tên, mô tả, tác giả"
      />

      {/* ── Preview Modal ── */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closePreview() }}
        >
          <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-4xl h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {previewDoc.title ?? previewDoc.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {previewDoc.author ?? previewDoc.courseName}
                  {previewDoc.publishYear ? ` • ${previewDoc.publishYear}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <DownloadIcon width={13} height={13} /> Tải xuống
                </button>
                <button
                  onClick={closePreview}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Đóng"
                >
                  <span className="text-base leading-none">✕</span>
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 min-h-0 bg-slate-100 flex items-center justify-center">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <span className="w-8 h-8 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs">Đang tải xem trước…</p>
                </div>
              ) : previewError ? (
                <div className="flex flex-col items-center gap-3 text-slate-500 p-8 text-center">
                  <FileTextIcon width={40} height={40} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Không thể xem trước</p>
                  <p className="text-xs text-slate-400 max-w-sm">{previewError}</p>
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title={previewDoc.title ?? previewDoc.name}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-5">

          {/* ── Error banners ── */}
          {error && (
            <Alert variant="error">
              Không tải được danh sách tài liệu. {error}
            </Alert>
          )}
          {downloadError && (
            <Alert variant="error" className="flex items-center justify-between">
              <span>{downloadError}</span>
              <button
                onClick={() => setDownloadError(null)}
                className="ml-4 font-bold text-red-600 hover:text-red-800 text-xs"
              >
                ✕
              </button>
            </Alert>
          )}

          {/* ── Toolbar ── */}
          <div className="flex flex-col gap-3">
            {/* Row 1: search + sort + view toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search — q param (OR title/description/author) */}
              <div className="relative flex-1 min-w-0 sm:max-w-sm">
                <SearchIcon
                  width={16} height={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm theo tên, mô tả, tác giả..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-xs transition-all"
                />
                {q && (
                  <button
                    onClick={() => setQ('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-all whitespace-nowrap"
                >
                  <span className="text-slate-400">Sắp xếp:</span>
                  {SORT_LABELS[sort]}
                  <ChevronDownIcon width={14} height={14} className={`text-slate-400 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-40">
                    {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => { setSort(val); setSortOpen(false) }}
                        className={`flex items-center justify-between w-full px-4 py-2.5 text-xs transition-colors ${sort === val
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        {label}
                        {sort === val && <span className="text-indigo-500">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View switcher */}
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Dạng thẻ"
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  <GridIcon width={15} height={15} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Dạng bảng"
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  <ListIcon width={15} height={15} />
                </button>
              </div>
            </div>

            {/* Row 2: fileType filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium shrink-0">Định dạng:</span>
              {([
                { value: '' as FileTypeFilter, label: 'Tất cả' },
                { value: 'pdf' as FileTypeFilter, label: '📄 PDF' },
                { value: 'txt' as FileTypeFilter, label: '📝 TXT' },
                { value: 'docx' as FileTypeFilter, label: '📝 DOCX' },
              ] as { value: FileTypeFilter; label: string }[]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFileType(value)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${pillCls(fileType === value)}`}
                >
                  {label}
                </button>
              ))}

              {/* Active filter badge */}
              {hasActiveFilters && (
                <button
                  onClick={() => { setQ(''); setFileType(''); setCommittedQ('') }}
                  className="ml-auto text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  ✕ Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="w-8 h-8 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs text-slate-400">
              <FileTextIcon width={40} height={40} />
              <p className="text-sm">
                {hasActiveFilters ? 'Không tìm thấy tài liệu phù hợp.' : 'Thư viện chưa có tài liệu nào.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => { setQ(''); setFileType(''); setCommittedQ('') }}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* ── GRID ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {docs.map((doc, idx) => {
                const palette = CARD_PALETTES[((page - 1) * PAGE_LIMIT + idx) % CARD_PALETTES.length]
                return (
                  <div
                    key={doc.id}
                    className="group flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
                  >
                    {/* Banner */}
                    <div className={`h-40 p-4 ${palette.bg} flex flex-col justify-between relative border-b border-slate-100/60`}>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase bg-white/90 shadow-2xs ${EXT_COLOR[doc.fileType] ?? 'text-slate-600 border-slate-200'}`}>
                          {doc.fileType}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center my-auto">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-xs border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <ImageIcon width={22} height={22} className={palette.text} />
                        </div>
                        {doc.docType && (
                          <span className={`text-xs font-semibold mt-2 ${palette.text}`}>
                            {doc.docType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                      <div>
                        <h3
                          className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors"
                          title={doc.title ?? doc.name}
                        >
                          {doc.title ?? doc.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{doc.courseName}</p>
                        {doc.author && (
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {doc.author}{doc.publishYear ? ` • ${doc.publishYear}` : ''}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                        <span className="text-[11px] text-slate-400">{fmtDate(doc.uploadedAt)}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openPreview(doc)}
                            className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-indigo-600 transition-colors text-xs"
                          >
                            Xem trước
                          </button>
                          <span className="text-slate-200">|</span>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 transition-colors text-xs"
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
            /* ── TABLE ── */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Cho phép cuộn ngang trên màn hẹp — xem chú thích ở DocumentsPage. */}
              <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    {['TÊN TÀI LIỆU', 'MÔN HỌC', 'LOẠI / TÁC GIẢ', 'KÍCH THƯỚC', 'CẬP NHẬT', 'THAO TÁC'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest text-slate-400 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc, i) => {
                    return (
                      <tr
                        key={doc.id}
                        className={`border-b border-slate-50 hover:bg-indigo-50/30 transition-colors ${i % 2 !== 0 ? 'bg-slate-50/30' : ''}`}
                      >
                        <td className="px-4 py-3 max-w-[220px]">
                          <div className="flex items-center gap-2.5">
                            <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${EXT_COLOR[doc.fileType] ?? 'bg-slate-50 text-slate-500 border-slate-100'}`}>
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
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{doc.courseName}</td>
                        <td className="px-4 py-3">
                          {doc.docType && <p className="text-xs text-slate-700 font-medium">{doc.docType}</p>}
                          {doc.author && <p className="text-[11px] text-slate-400 mt-0.5">{doc.author}</p>}
                          {doc.publishYear && <p className="text-[11px] text-slate-400">{doc.publishYear}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{fmtSize(doc.sizeBytes)}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{fmtDate(doc.uploadedAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openPreview(doc)}
                              title="Xem trước"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <FileTextIcon width={15} height={15} />
                            </button>
                            <button
                              onClick={() => handleDownload(doc)}
                              title="Tải xuống"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <DownloadIcon width={15} height={15} />
                            </button>
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

          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-400">
                Trang {page}/{totalPages} • {total} tài liệu
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Trước
                </button>
                {/* Page number pills */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2
                  if (p < 1 || p > totalPages) return null
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs rounded-lg border transition-all ${p === page
                        ? 'bg-indigo-600 border-indigo-600 text-white font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Tiếp →
                </button>
              </div>
            </div>
          )}

          {/* Footer stats */}
          {!loading && total > 0 && totalPages <= 1 && (
            <p className="text-xs text-slate-400">
              {total} tài liệu trong thư viện công khai
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
