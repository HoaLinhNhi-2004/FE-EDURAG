import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Alert, DownloadIcon, FileTextIcon, Spinner, XIcon } from '@/components/ui'
import type { ApiError, Citation } from '@/types'
import { citationsApi } from '@/api/citations.api'

// Worker của pdf.js (Vite tự resolve thành asset).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

/** Bề rộng trang PDF tối đa (khi panel ở dạng cột bên phải). */
const PAGE_WIDTH = 460
/** Padding p-4 hai bên của vùng cuộn — trừ ra để trang không bị tràn. */
const PAGE_GUTTER = 32

/** Chờ text-layer render xong (~1.8s) trước khi chịu thua và cuộn theo pageNumber. */
const GRACE_TICKS = 12

const HEADING_RE = /^\s{0,3}#{1,6}\s+(.*)$/
const TABLE_ROW_RE = /^\s*\|.*\|\s*$/
/** Số/chữ đánh mục đứng một mình: "1.", "2)", "IV.", "a)". */
const ORDINAL_ONLY_RE = /^(?:\d{1,3}|[IVXLC]{1,6}|[a-z])[.)]?$/i

/** Bỏ cú pháp Markdown inline, giữ nguyên phần chữ. */
const stripInline = (s: string) =>
  s
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim()

/**
 * Bỏ cú pháp Markdown khỏi chuỗi trước khi so khớp.
 * BE chuyển tài liệu sang Markdown lúc ingest nên `sourceText` có `#`, `**`… trong
 * khi text-layer của PDF thì không — không bỏ đi thì highlight trượt.
 */
const stripMarkdown = (s: string) =>
  stripInline(
    s
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s{0,3}>\s?/gm, '')
      .replace(/^\s{0,3}[-*+]\s+/gm, '')
      .replace(/\|/g, ' '),
  )

// Bỏ dấu tiếng Việt + gom khoảng trắng + bỏ dấu câu cuối — để so khớp text-layer
// bền hơn (BE lưu ý: highlight best-effort do khác encoding/normalize/OCR).
const normalize = (s: string) =>
  stripMarkdown(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[.,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()

type ExcerptLine = { kind: 'heading' | 'text'; text: string }

/**
 * Tách đoạn trích thô thành các dòng có phân loại để hiển thị tử tế.
 * Không dựng bảng thật — dòng dạng bảng giữ nguyên vì bóc dấu `|` là mất cột.
 */
function parseExcerpt(raw: string): ExcerptLine[] {
  const lines = raw.split('\n')
  const out: ExcerptLine[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (TABLE_ROW_RE.test(line)) {
      out.push({ kind: 'text', text: line.trim() })
      continue
    }

    const heading = line.match(HEADING_RE)
    if (heading) {
      let text = stripInline(heading[1])
      // Bộ chuyển tài liệu sang Markdown hay tách "# 1." khỏi tiêu đề thật ở dòng
      // kế tiếp — gộp lại để không còn số mục lơ lửng một mình.
      if (ORDINAL_ONLY_RE.test(text)) {
        const next = lines[i + 1]?.trim()
        if (next && !HEADING_RE.test(next) && !TABLE_ROW_RE.test(next)) {
          text = `${text} ${stripInline(next)}`.trim()
          i++
        }
      }
      if (text) out.push({ kind: 'heading', text })
      continue
    }

    const text = stripInline(line)
    if (text) out.push({ kind: 'text', text })
  }

  return out
}

/**
 * UC 10 — Panel xem tài liệu gốc từ thẻ trích dẫn.
 * Flow: lấy chi tiết citation → tải bản PDF chuẩn hóa của tài liệu (mọi định dạng
 * đều đi đường này; DOCX được BE sinh sẵn PDF lúc ingest) → PDF.js render,
 * highlight sourceText trong text-layer rồi cuộn tới đúng đoạn đó.
 * Không có bản preview (PPTX / chưa sinh xong / tài liệu đã xóa) → fallback: hiện đoạn trích.
 */
export function PdfViewerPanel({
  citation,
  onClose,
}: {
  citation: Citation
  onClose: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  // Trang PDF co theo bề rộng thật của khung: ở khổ điện thoại 460px cố định sẽ
  // tràn ra ngoài, buộc người đọc phải cuộn ngang từng dòng.
  const [pageWidth, setPageWidth] = useState(PAGE_WIDTH)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const apply = () => setPageWidth(Math.min(PAGE_WIDTH, el.clientWidth - PAGE_GUTTER))
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const [numPages, setNumPages] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  // 1) Chi tiết citation — để biết documentId + originalAvailable + dữ liệu chuẩn từ BE.
  const detailQuery = useQuery({
    queryKey: ['citation', citation.id],
    queryFn: () => citationsApi.getCitation(citation.id),
  })
  const detail = detailQuery.data ?? citation
  const targetPage = detail.pageNumber ?? 1
  const documentId = detail.documentId

  // 2) Bản PDF chuẩn hóa để render. documentId = null nghĩa là tài liệu gốc đã bị xóa.
  const previewQuery = useQuery({
    queryKey: ['citation-preview', documentId],
    queryFn: () => citationsApi.getDocumentPreview(documentId as number),
    enabled: documentId != null,
    retry: false,
  })

  // Blob → object URL cho pdf.js.
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!previewQuery.data) {
      setObjectUrl(null)
      return
    }
    const url = URL.createObjectURL(previewQuery.data)
    setObjectUrl(url)
    setNumPages(0)
    return () => URL.revokeObjectURL(url)
  }, [previewQuery.data])

  // Highlight best-effort: tô text-item khớp (một chiều) với sourceText (BE chưa có toạ độ).
  const customTextRenderer = useMemo(() => {
    const target = normalize(detail.sourceText ?? '')
    if (!target) return undefined
    return ({ str }: { str: string }) => {
      const t = normalize(str)
      if (t.length >= 3 && (target.includes(t) || t.includes(target))) {
        return `<mark style="background: rgba(250, 204, 21, 0.45); color: inherit;">${str}</mark>`
      }
      return str
    }
  }, [detail.sourceText])

  // Cuộn tới đoạn được highlight. `pageNumber` với DOCX là segment giả lập, không
  // phải trang của bản PDF sinh ra — nên chỉ dùng khi không khớp được chữ nào.
  useEffect(() => {
    if (!numPages) return
    let ticks = 0
    let scrolls = 0
    const id = setInterval(() => {
      ticks++
      const root = scrollRef.current
      if (!root) return

      const pageEl = root.querySelector(`#pdf-page-${targetPage}`) as HTMLElement | null
      // Ưu tiên highlight nằm đúng trang BE chỉ: sourceText ngắn (vd tên tài liệu)
      // khớp được ở nhiều trang, lấy cái đầu tiên trong tài liệu sẽ cuộn sai chỗ.
      const onTargetPage = pageEl?.querySelector('mark') as HTMLElement | null
      // Hết thời gian chờ mới chấp nhận highlight ở trang khác — với DOCX thì
      // pageNumber là segment giả lập, không trùng trang của bản PDF sinh ra.
      const mark =
        onTargetPage ??
        (ticks >= GRACE_TICKS ? (root.querySelector('mark') as HTMLElement | null) : null)

      if (mark) {
        mark.scrollIntoView({ block: 'center' })
        if (++scrolls >= 3) clearInterval(id)
        return
      }

      // Không khớp được chữ nào → lùi về pageNumber.
      if (ticks >= GRACE_TICKS && pageEl && pageEl.offsetHeight > 50) {
        pageEl.scrollIntoView({ block: 'start' })
        if (++scrolls >= 3) clearInterval(id)
      }
      if (ticks > 40) clearInterval(id)
    }, 150)
    return () => clearInterval(id)
  }, [numPages, targetPage])

  // Tải file gốc — chỉ khi người dùng bấm, vì phần render đã dùng bản preview.
  const handleDownload = useCallback(async () => {
    setDownloading(true)
    setDownloadError('')
    try {
      const { blob } = await citationsApi.getCitationFile(citation.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = detail.documentTitle || 'tai-lieu'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError('Không tải được file gốc. Vui lòng thử lại.')
    } finally {
      setDownloading(false)
    }
  }, [citation.id, detail.documentTitle])

  const previewError = (previewQuery.error as unknown) as ApiError | null
  const fallbackNote =
    documentId == null
      ? 'Tài liệu gốc đã bị xóa khỏi hệ thống. Dưới đây là đoạn trích đã lưu.'
      : previewError?.code === 'PREVIEW_NOT_READY'
        ? 'Định dạng này chưa có bản xem trước. Dưới đây là đoạn trích đã lưu.'
        : previewError?.status === 404
          ? 'Không tìm thấy tài liệu gốc. Dưới đây là đoạn trích đã lưu.'
          : 'Không mở được tài liệu gốc. Dưới đây là đoạn trích đã lưu.'

  const showFallback = documentId == null || previewError != null

  return (
    // Dưới lg: phủ toàn màn hình — 480px cạnh khung chat sẽ không còn chỗ cho chat
    // trên điện thoại/tablet. Từ lg trở lên: trở lại cột bên phải như split-view.
    <aside className="fixed inset-0 z-40 flex h-full w-full flex-col bg-white overflow-hidden lg:static lg:z-auto lg:w-[520px] lg:shrink-0 lg:border-l lg:border-slate-200">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 bg-white">
        <div className="flex min-w-0 items-center gap-2">
          <FileTextIcon width={18} height={18} className="shrink-0 text-indigo-500" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{detail.documentTitle}</p>
            {detail.pageNumber != null && (
              <p className="text-xs text-slate-400">Trang {detail.pageNumber}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {detail.originalAvailable === true && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              title="Tải file gốc"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              {downloading ? <Spinner /> : <DownloadIcon width={18} height={18} />}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Đóng"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <XIcon width={18} height={18} />
          </button>
        </div>
      </header>

      {downloadError && (
        <div className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
          {downloadError}
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
        {detailQuery.isPending || (documentId != null && previewQuery.isPending) ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Spinner /> Đang mở tài liệu…
          </div>
        ) : showFallback ? (
          <FallbackSource sourceText={detail.sourceText} note={fallbackNote} />
        ) : objectUrl ? (
          <Document
            file={objectUrl}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            loading={
              <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                <Spinner /> Đang tải PDF…
              </div>
            }
            error={<Alert variant="error">Không đọc được nội dung PDF.</Alert>}
          >
            {Array.from({ length: numPages }, (_, i) => {
              const pageNo = i + 1
              return (
                <div id={`pdf-page-${pageNo}`} key={pageNo} className="mx-auto mb-3 w-fit shadow-sm">
                  <Page
                    pageNumber={pageNo}
                    width={pageWidth}
                    customTextRenderer={customTextRenderer}
                    renderAnnotationLayer={false}
                  />
                </div>
              )
            })}
          </Document>
        ) : null}
      </div>
    </aside>
  )
}

function FallbackSource({ sourceText, note }: { sourceText: string; note: string }) {
  const lines = useMemo(() => parseExcerpt(sourceText ?? ''), [sourceText])

  return (
    <div className="mx-auto max-w-md">
      <Alert variant="info">{note}</Alert>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Đoạn trích nguồn</p>
        {lines.length === 0 ? (
          <p className="mt-2 text-sm italic text-slate-400">Không có nội dung trích dẫn.</p>
        ) : (
          <div className="mt-2">
            {lines.map((line, i) =>
              line.kind === 'heading' ? (
                <p key={i} className="mt-3 text-sm font-semibold text-slate-900 first:mt-0">
                  {line.text}
                </p>
              ) : (
                <p key={i} className="mt-1.5 text-sm leading-relaxed text-slate-700 first:mt-0">
                  {line.text}
                </p>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  )
}
