import { http, HttpResponse, delay } from 'msw'
import type { ChatMessage, ChatSession, SendMessageRequest } from '@/types'
import { genMessageId, genSessionId, mockChatMessages, mockChatSessions } from './data'
import { MOCK_PDF_BASE64 } from './mockPdf'

// Đoạn trích trùng với nội dung trang 3 của PDF mock → highlight best-effort test được.
const PAGE3_TEXT = 'Mạng nơ-ron gồm ba lớp: input, hidden và output.'
const MOCK_DOC_TITLE = 'Bài giảng AI cơ bản.pdf'
// id dành riêng để test file gốc không khả dụng (409).
const UNAVAILABLE_CITATION_ID = 9999

const pdfBytes = () => Uint8Array.from(atob(MOCK_PDF_BASE64), (c) => c.charCodeAt(0))

const API = import.meta.env.VITE_API_BASE_URL

const ok = <T>(data: T, status = 200) =>
  HttpResponse.json({ success: true, message: 'OK', data }, { status })
const fail = (status: number, errorCode: string, message: string) =>
  HttpResponse.json({ success: false, message, errorCode }, { status })

// Từ khóa mô phỏng câu hỏi ngoài phạm vi tài liệu (UC 7: không bịa câu trả lời).
const OUT_OF_SCOPE = ['thời tiết', 'bóng đá', 'nấu ăn', 'crypto', 'chứng khoán']

/** Lưu tin nhắn vào kho dùng chung + cập nhật phiên (để màn Lịch sử phản ánh đúng). */
const appendMessage = (sessionId: string, message: ChatMessage) => {
  mockChatMessages[sessionId] = [...(mockChatMessages[sessionId] ?? []), message]
  const session = mockChatSessions.find((s) => String(s.id) === sessionId)
  if (session) {
    session.updatedAt = message.createdAt
    // Đặt tiêu đề phiên theo câu hỏi đầu tiên (giống cách các app chat vẫn làm).
    if (session.title === 'Cuộc trò chuyện mới' && message.role === 'user') {
      session.title = message.content.slice(0, 60) || session.title
    }
  }
}

export const chatHandlers = [
  // POST /api/chat/sessions — tạo phiên chat mới (lưu vào kho dùng chung → hiện ở Lịch sử).
  http.post(`${API}/chat/sessions`, async ({ request }) => {
    await delay(150)
    const body = (await request.json().catch(() => ({}))) as { title?: string }
    const now = new Date().toISOString()
    const session: ChatSession = {
      id: genSessionId(),
      title: body.title ?? 'Cuộc trò chuyện mới',
      createdAt: now,
      updatedAt: now,
    }
    mockChatSessions.push(session)
    mockChatMessages[String(session.id)] = []
    return ok(session, 201)
  }),

  // DELETE /api/chat/sessions/{id} — xóa phiên (UC 9). Trả 204 như OpenAPI.
  http.delete(`${API}/chat/sessions/:id`, async ({ params }) => {
    await delay(200)
    const id = String(params.id)
    const index = mockChatSessions.findIndex((s) => String(s.id) === id)
    if (index === -1) {
      return fail(404, 'SESSION_NOT_FOUND', 'Phiên chat không tồn tại.')
    }
    mockChatSessions.splice(index, 1)
    delete mockChatMessages[id]
    return new HttpResponse(null, { status: 204 })
  }),

  // POST /api/chat/sessions/{id}/messages — gửi câu hỏi (text hoặc ảnh), nhận câu trả lời RAG.
  http.post(`${API}/chat/sessions/:id/messages`, async ({ request, params }) => {
    const sessionId = String(params.id)
    const contentType = request.headers.get('content-type') ?? ''
    let content = ''
    let imageName: string | null = null

    // UC 11: ảnh gửi qua multipart; câu hỏi text gửi qua JSON.
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      content = (form.get('content') as string) ?? ''
      const image = form.get('image')
      if (image && typeof image !== 'string') imageName = image.name
    } else {
      content = ((await request.json()) as SendMessageRequest).content
    }
    const q = content.toLowerCase()

    // Mô phỏng timeout / RAG lỗi để test exception flow (UC 7).
    if (q.includes('timeout')) {
      await delay(500)
      return fail(503, 'RAG_UNAVAILABLE', 'Trợ lý AI đang bận, vui lòng thử lại sau giây lát.')
    }

    await delay(900) // mô phỏng độ trễ RAG (OCR/multimodal)

    const now = new Date().toISOString()

    // Lưu câu hỏi của người dùng vào kho dùng chung (để Lịch sử — UC 9 — có nội dung).
    appendMessage(sessionId, {
      id: genMessageId(),
      role: 'user',
      content: content || '[Ảnh đính kèm]',
      createdAt: now,
    })

    // Lưu câu trả lời rồi mới trả về, để mở lại phiên vẫn thấy đủ hội thoại.
    const reply = (message: ChatMessage) => {
      appendMessage(sessionId, message)
      return ok(message)
    }

    // UC 11 — ảnh: mô phỏng OCR fail nếu tên file gợi ý ảnh mờ; ngược lại trả tài liệu khớp.
    if (imageName) {
      if (/mo|blur|nhoe/i.test(imageName)) {
        return reply({
          id: genMessageId(),
          role: 'assistant',
          content:
            'Ảnh chưa đủ rõ để nhận diện nội dung (OCR không đọc được chữ). Vui lòng chụp lại rõ nét hơn.',
          citations: [],
          createdAt: now,
        })
      }
      return reply({
        id: genMessageId(),
        role: 'assistant',
        content:
          'Mình đã phân tích nội dung trong ảnh và tìm thấy các tài liệu liên quan trong kho học liệu:',
        citations: [
          {
            id: 3,
            documentId: 1,
            documentTitle: MOCK_DOC_TITLE,
            pageNumber: 3,
            sourceText: PAGE3_TEXT,
          },
        ],
        createdAt: now,
      })
    }

    // Ngoài phạm vi tài liệu → không bịa, không kèm trích dẫn.
    if (OUT_OF_SCOPE.some((k) => q.includes(k))) {
      return reply({
        id: genMessageId(),
        role: 'assistant',
        content:
          'Xin lỗi, mình không tìm thấy thông tin liên quan trong tài liệu môn học để trả lời câu hỏi này.',
        citations: [],
        createdAt: now,
      })
    }

    // Trong phạm vi → trả lời kèm ít nhất 1 trích dẫn (UC 7).
    return reply({
      id: genMessageId(),
      role: 'assistant',
      content: [
        `Dựa trên tài liệu môn học, đây là nội dung liên quan đến câu hỏi của bạn:`,
        '',
        `"${content.trim()}"`,
        '',
        'Nội dung được tổng hợp từ các đoạn tài liệu được trích dẫn bên dưới. Bạn có thể xem chi tiết ở nguồn gốc để đối chiếu chính xác.',
      ].join('\n'),
      citations: [
        {
          id: 1,
          documentId: 1,
          documentTitle: MOCK_DOC_TITLE,
          pageNumber: 3,
          sourceText: PAGE3_TEXT,
        },
        {
          id: 2,
          documentId: 1,
          documentTitle: MOCK_DOC_TITLE,
          pageNumber: 2,
          sourceText: 'Bài giảng AI cơ bản',
        },
      ],
      createdAt: now,
    })
  }),

  // GET /api/citations/{id} — chi tiết trích dẫn (để lấy originalAvailable trước khi mở file).
  http.get(`${API}/citations/:id`, async ({ params }) => {
    await delay(150)
    const id = Number(params.id)
    return ok({
      id,
      messageId: null,
      documentId: 1,
      chunkId: null,
      citationOrder: 1,
      documentTitle: MOCK_DOC_TITLE,
      pageNumber: id === 2 ? 2 : 3,
      sectionTitle: null,
      sourceText: id === 2 ? 'Bài giảng AI cơ bản' : PAGE3_TEXT,
      sourceLocator: null,
      retrievalScore: null,
      rerankScore: null,
      originalAvailable: id !== UNAVAILABLE_CITATION_ID,
    })
  }),

  // GET /api/citations/{id}/file — stream file gốc (binary). 409 nếu file không khả dụng.
  http.get(`${API}/citations/:id/file`, async ({ params }) => {
    await delay(200)
    if (Number(params.id) === UNAVAILABLE_CITATION_ID) {
      return HttpResponse.json(
        { success: false, message: 'File gốc hiện không mở được.', errorCode: 'ORIGINAL_SOURCE_UNAVAILABLE' },
        { status: 409 },
      )
    }
    return new HttpResponse(pdfBytes(), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment' },
    })
  }),
]
