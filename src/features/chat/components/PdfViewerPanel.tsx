import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Alert, Button, FileTextIcon, Spinner, XIcon } from '@/components/ui'
import type { ApiError, Citation } from '@/types'
import { citationsApi } from '@/api/citations.api'

// Worker của pdf.js (Vite tự resolve thành asset).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const PAGE_WIDTH = 460

// Bỏ dấu tiếng Việt + gom khoảng trắng + bỏ dấu câu cuối — để so khớp text-layer
// bền hơn (BE lưu ý: highlight best-effort do khác encoding/normalize/OCR).
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[.,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * UC 10 — Panel xem tài liệu gốc từ thẻ trích dẫn.
 * Flow: lấy chi tiết citation (originalAvailable) → tải file (Blob) → PDF.js render,
 * cuộn đến pageNumber, highlight sourceText best-effort trong text-layer.
 * Không phải PDF / file không khả dụng → fallback: hiện sourceText + tải xuống.
 */
export function PdfViewerPanel({
  citation,
  onClose,
}: {
  citation: Citation
  onClose: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState(0)

  // 1) Chi tiết citation — để biết originalAvailable + dữ liệu chuẩn từ BE.
  const detailQuery = useQuery({
    queryKey: ['citation', citation.id],
    queryFn: () => citationsApi.getCitation(citation.id),
  })
  const detail = detailQuery.data ?? citation
  const targetPage = detail.pageNumber ?? 1
  const available = detail.originalAvailable

  // 2) Tải file gốc (chỉ khi originalAvailable === true).
  const fileQuery = useQuery({
    queryKey: ['citation-file', citation.id],
    queryFn: () => citationsApi.getCitationFile(citation.id),
    enabled: available === true,
    retry: false,
  })

  // Blob → object URL cho pdf.js / nút tải xuống.
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!fileQuery.data) return
    const url = URL.createObjectURL(fileQuery.data.blob)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [fileQuery.data])

  const isPdf = fileQuery.data?.contentType.includes('pdf') ?? false

  // Cuộn tới đúng trang: poll đến khi trang mục tiêu có chiều cao thật (đã render xong),
  // rồi cuộn vài lần để chống scroll bị reset do text-layer reflow.
  useEffect(() => {
    if (!numPages) return
    let tries = 0
    let scrolls = 0
    const id = setInterval(() => {
      const el = scrollRef.current?.querySelector(`#pdf-page-${targetPage}`) as HTMLElement | null
      if (el && el.offsetHeight > 50) {
        el.scrollIntoView({ block: 'start' })
        if (++scrolls >= 3) clearInterval(id)
      } else if (++tries > 40) {
        clearInterval(id)
      }
    }, 150)
    return () => clearInterval(id)
  }, [numPages, targetPage])

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

  const fileError = fileQuery.error as ApiError | null

  return (
    <aside className="flex w-[520px] shrink-0 flex-col border-l border-slate-200 bg-white">
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileTextIcon width={18} height={18} className="shrink-0 text-indigo-500" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{detail.documentTitle}</p>
            {detail.pageNumber != null && (
              <p className="text-xs text-slate-400">Trang {detail.pageNumber}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Đóng"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <XIcon width={18} height={18} />
        </button>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
        {detailQuery.isPending || (available && fileQuery.isPending) ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Spinner /> Đang mở tài liệu…
          </div>
        ) : available === false || fileError ? (
          // File gốc không khả dụng (409) → vẫn hiện đoạn trích (UC 10 exception).
          <FallbackSource
            sourceText={detail.sourceText}
            note="File gốc hiện không mở được. Dưới đây là đoạn trích đã lưu."
          />
        ) : objectUrl && !isPdf ? (
          // File không phải PDF (DOCX/TXT) → không render trực tiếp, cho tải xuống.
          <FallbackSource
            sourceText={detail.sourceText}
            note="Định dạng này chưa xem trực tiếp được."
            downloadUrl={objectUrl}
            downloadName={detail.documentTitle}
          />
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
                    width={PAGE_WIDTH}
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

function FallbackSource({
  sourceText,
  note,
  downloadUrl,
  downloadName,
}: {
  sourceText: string
  note: string
  downloadUrl?: string
  downloadName?: string
}) {
  return (
    <div className="mx-auto max-w-md">
      <Alert variant="info">{note}</Alert>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Đoạn trích nguồn</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{sourceText}</p>
      </div>
      {downloadUrl && (
        <a href={downloadUrl} download={downloadName} className="mt-4 inline-block">
          <Button variant="secondary">Tải xuống file gốc</Button>
        </a>
      )}
    </div>
  )
}
