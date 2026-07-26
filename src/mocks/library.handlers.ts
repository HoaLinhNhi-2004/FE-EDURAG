import { http, HttpResponse, delay } from 'msw'
import type { LibraryDocument } from '@/types'
import { MOCK_PDF_BASE64 } from './mockPdf'

const API = import.meta.env.VITE_API_BASE_URL

const ok = <T>(data: T, status = 200) =>
  HttpResponse.json({ success: true, message: 'OK', data }, { status })
const fail = (status: number, errorCode: string, message: string) =>
  HttpResponse.json({ success: false, message, errorCode }, { status })

const pdfBytes = () => Uint8Array.from(atob(MOCK_PDF_BASE64), (c) => c.charCodeAt(0))

// Dữ liệu thư viện mô phỏng (chỉ tài liệu visible+ready như BE eligible).
const mockLibrary: LibraryDocument[] = [
  { id: 1, title: 'Bài giảng AI cơ bản', fileType: 'pdf', fileSize: 2_400_000, pageCount: null, createdAt: '2026-07-10T09:00:00Z', originalAvailable: true },
  { id: 2, title: 'Giáo trình Học Máy', fileType: 'pdf', fileSize: 8_100_000, pageCount: null, createdAt: '2026-07-08T09:00:00Z', originalAvailable: true },
  { id: 3, title: 'Slide Deep Learning - Chương 1', fileType: 'pptx', fileSize: 5_600_000, pageCount: null, createdAt: '2026-07-05T09:00:00Z', originalAvailable: true },
  { id: 4, title: 'Đề cương ôn tập NLP', fileType: 'docx', fileSize: 320_000, pageCount: null, createdAt: '2026-07-03T09:00:00Z', originalAvailable: true },
  { id: 5, title: 'Ghi chú Computer Vision', fileType: 'txt', fileSize: 45_000, pageCount: null, createdAt: '2026-07-01T09:00:00Z', originalAvailable: true },
  { id: 6, title: 'Tài liệu tham khảo Khoa học Dữ liệu', fileType: 'pdf', fileSize: 12_800_000, pageCount: null, createdAt: '2026-06-28T09:00:00Z', originalAvailable: false },
]

function mimeFor(fileType: string): string {
  if (fileType === 'pdf') return 'application/pdf'
  if (fileType === 'txt') return 'text/plain; charset=utf-8'
  if (fileType === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  return 'application/octet-stream'
}

export const libraryHandlers = [
  // GET /api/library/documents — list (offset/limit/search). BE tự lọc visible+ready.
  http.get(`${API}/library/documents`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()
    const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0))
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20)))
    const matched = search
      ? mockLibrary.filter((d) => d.title.toLowerCase().includes(search))
      : mockLibrary
    const documents = matched.slice(offset, offset + limit)
    return ok({ offset, limit, total: matched.length, documents })
  }),

  // GET /api/library/documents/:id/source — stream file gốc (xem/tải).
  http.get(`${API}/library/documents/:id/source`, async ({ params }) => {
    await delay(200)
    const doc = mockLibrary.find((d) => d.id === Number(params.id))
    if (!doc) return fail(404, 'LIBRARY_DOCUMENT_NOT_FOUND', 'Không tìm thấy tài liệu.')
    if (!doc.originalAvailable) {
      return fail(409, 'ORIGINAL_SOURCE_UNAVAILABLE', 'File gốc hiện không khả dụng.')
    }
    const body =
      doc.fileType === 'pdf' ? pdfBytes() : new TextEncoder().encode('Nội dung tài liệu mô phỏng.')
    // Mock chỉ cần Content-Type; FE lấy tên tải về từ title nên bỏ Content-Disposition
    // (tránh rủi ro encoding tên tiếng Việt trong Headers). BE thật tự set qua res.attachment.
    return new HttpResponse(body, {
      status: 200,
      headers: { 'Content-Type': mimeFor(doc.fileType) },
    })
  }),

  // GET /api/library/documents/:id — chi tiết.
  http.get(`${API}/library/documents/:id`, async ({ params }) => {
    await delay(150)
    const doc = mockLibrary.find((d) => d.id === Number(params.id))
    if (!doc) return fail(404, 'LIBRARY_DOCUMENT_NOT_FOUND', 'Không tìm thấy tài liệu.')
    return ok({ document: doc })
  }),
]
