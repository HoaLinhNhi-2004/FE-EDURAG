import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import { Alert, Button, Spinner } from '@/components/ui'
import { DownloadIcon, FileTextIcon, XIcon } from '@/components/ui/icons'
import type { ApiError, LibraryDocument } from '@/types'
import { libraryApi } from '@/api/library.api'
import { downloadName } from '../utils'

// Worker của pdf.js (Vite tự resolve thành asset).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const PAGE_WIDTH = 720

/**
 * Modal xem tài liệu thư viện (toàn màn). PDF → render inline; DOCX/TXT/khác → cho tải xuống.
 * Tải file qua libraryApi.openSource (blob + Bearer), revoke object URL khi đóng.
 */
export function LibraryViewerModal({
  doc,
  onClose,
}: {
  doc: LibraryDocument
  onClose: () => void
}) {
  const [numPages, setNumPages] = useState(0)

  const fileQuery = useQuery({
    queryKey: ['library-file', doc.id],
    queryFn: () => libraryApi.openSource(doc.id),
    enabled: doc.originalAvailable,
    retry: false,
  })

  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!fileQuery.data) return
    const url = URL.createObjectURL(fileQuery.data.blob)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [fileQuery.data])

  const isPdf = fileQuery.data?.contentType.includes('pdf') ?? false
  const fileError = fileQuery.error as ApiError | null
  const unavailable = !doc.originalAvailable || !!fileError

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-slate-700 bg-slate-800 px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <FileTextIcon width={18} height={18} className="shrink-0 text-indigo-300" />
          <p className="truncate text-sm font-semibold">{doc.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {objectUrl && (
            <a href={objectUrl} download={downloadName(doc)}>
              <Button variant="secondary">
                <DownloadIcon width={16} height={16} />
                Tải xuống
              </Button>
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <XIcon width={20} height={20} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
        {unavailable ? (
          <div className="mx-auto max-w-md pt-16">
            <Alert variant="error">
              Tài liệu gốc hiện không mở được. Vui lòng thử lại sau.
            </Alert>
          </div>
        ) : fileQuery.isPending ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Spinner /> Đang mở tài liệu…
          </div>
        ) : objectUrl && !isPdf ? (
          // DOCX/TXT/khác — không xem trực tiếp, cho tải xuống.
          <div className="mx-auto max-w-md pt-16 text-center">
            <Alert variant="info">
              Định dạng “{doc.fileType.toUpperCase()}” chưa xem trực tiếp được trên web. Vui lòng
              tải xuống để mở bằng ứng dụng phù hợp.
            </Alert>
            {objectUrl && (
              <a href={objectUrl} download={downloadName(doc)} className="mt-4 inline-block">
                <Button>
                  <DownloadIcon width={16} height={16} />
                  Tải xuống file gốc
                </Button>
              </a>
            )}
          </div>
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
            {Array.from({ length: numPages }, (_, i) => (
              <div key={i} className="mx-auto mb-3 w-fit shadow-sm">
                <Page pageNumber={i + 1} width={PAGE_WIDTH} renderAnnotationLayer={false} />
              </div>
            ))}
          </Document>
        ) : null}
      </div>
    </div>
  )
}
