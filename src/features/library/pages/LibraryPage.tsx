import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { Alert, Button, Input, Spinner } from '@/components/ui'
import { DownloadIcon, EyeIcon, FileTextIcon, SearchIcon } from '@/components/ui/icons'
import type { ApiError, LibraryDocument } from '@/types'
import { libraryApi } from '@/api/library.api'
import { downloadName, fmtDate, fmtFileSize, triggerDownload } from '../utils'

// Lazy-load viewer: pdfjs chỉ tải khi bấm "Xem".
const LibraryViewerModal = lazy(() =>
  import('../components/LibraryViewerModal').then((m) => ({ default: m.LibraryViewerModal })),
)

const PAGE_SIZE = 20
// Lọc theo loại làm client-side (BE chỉ hỗ trợ search, không lọc loại).
const TYPE_FILTERS = ['pdf', 'docx', 'pptx', 'txt'] as const

/** Thư viện tài liệu — sinh viên/GV/Admin xem & tải tài liệu (visible+ready). */
export function LibraryPage() {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [type, setType] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [viewing, setViewing] = useState<LibraryDocument | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  // Debounce ô tìm kiếm; đổi từ khóa → về trang đầu.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(search.trim())
      setPage(0)
    }, 350)
    return () => clearTimeout(id)
  }, [search])

  const query = useQuery({
    queryKey: ['library', debounced, page],
    queryFn: () =>
      libraryApi.list({
        search: debounced || undefined,
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  })

  const docs = useMemo(() => query.data?.documents ?? [], [query.data])
  const filtered = useMemo(
    () => (type ? docs.filter((d) => d.fileType.toLowerCase() === type) : docs),
    [docs, type],
  )
  const total = query.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const download = useMutation({
    mutationFn: (doc: LibraryDocument) =>
      libraryApi.openSource(doc.id).then((res) => ({ blob: res.blob, doc })),
    onSuccess: ({ blob, doc }) => triggerDownload(blob, downloadName(doc)),
    onError: (err: ApiError) => setApiError(err.message),
  })

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Thư viện tài liệu</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tìm kiếm, xem trực tuyến và tải tài liệu học tập đã được xuất bản.
        </p>

        {/* Tìm kiếm + lọc loại */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              leftIcon={<SearchIcon />}
              placeholder="Tìm theo tên tài liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={type === null} onClick={() => setType(null)}>
              Tất cả
            </FilterChip>
            {TYPE_FILTERS.map((t) => (
              <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
                {t.toUpperCase()}
              </FilterChip>
            ))}
          </div>
        </div>

        {apiError && (
          <Alert variant="error" className="mt-4">
            {apiError}
          </Alert>
        )}

        {/* Nội dung */}
        <div className="mt-6">
          {query.isPending ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Spinner /> Đang tải thư viện…
            </div>
          ) : query.isError ? (
            <Alert variant="error">
              <div className="flex items-center justify-between gap-4">
                <span>Không tải được thư viện tài liệu. Vui lòng thử lại.</span>
                <Button variant="secondary" onClick={() => query.refetch()} loading={query.isFetching}>
                  Thử lại
                </Button>
              </div>
            </Alert>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center text-slate-500">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FileTextIcon width={28} height={28} />
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-700">Không có tài liệu nào</p>
              <p className="mt-1 max-w-sm text-sm">
                {debounced || type
                  ? 'Không tìm thấy tài liệu khớp bộ lọc hiện tại.'
                  : 'Chưa có tài liệu nào được xuất bản trong thư viện.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onView={() => setViewing(doc)}
                  onDownload={() => {
                    setApiError(null)
                    download.mutate(doc)
                  }}
                  downloading={download.isPending && download.variables?.id === doc.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Phân trang */}
        {!query.isError && total > PAGE_SIZE && (
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-600">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || query.isFetching}
            >
              Trước
            </Button>
            <span>
              Trang {page + 1} / {totalPages}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => p + 1)}
              disabled={page + 1 >= totalPages || query.isFetching}
            >
              Sau
            </Button>
          </div>
        )}
      </div>

      {viewing && (
        <Suspense fallback={null}>
          <LibraryViewerModal doc={viewing} onClose={() => setViewing(null)} />
        </Suspense>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────────
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function DocumentCard({
  doc,
  onView,
  onDownload,
  downloading,
}: {
  doc: LibraryDocument
  onView: () => void
  onDownload: () => void
  downloading: boolean
}) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <FileTextIcon width={20} height={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-slate-800" title={doc.title}>
            {doc.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium uppercase text-slate-500">
              {doc.fileType}
            </span>
            <span>{fmtFileSize(doc.fileSize)}</span>
            <span>·</span>
            <span>{fmtDate(doc.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={onView}
          disabled={!doc.originalAvailable}
        >
          <EyeIcon width={16} height={16} />
          Xem
        </Button>
        <Button
          className="flex-1"
          onClick={onDownload}
          loading={downloading}
          disabled={!doc.originalAvailable}
        >
          <DownloadIcon width={16} height={16} />
          Tải
        </Button>
      </div>

      {!doc.originalAvailable && (
        <p className="mt-2 text-center text-xs text-amber-600">File gốc tạm không khả dụng</p>
      )}
    </div>
  )
}
