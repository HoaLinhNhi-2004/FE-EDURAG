import { http, HttpResponse, delay } from 'msw'
import type {
  ChatMessage,
  ChatSession,
  SendMessageRequest,
  SendMessageResponse,
  WireChatMessage,
} from '@/types'
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

/**
 * Map tin nhắn lưu nội bộ (role) sang shape BE thật (senderType) để mock khớp contract B7.
 * noAnswer = trợ lý trả lời không kèm trích dẫn (ngoài phạm vi tài liệu).
 */
export const toWireMessage = (
  m: ChatMessage,
  sessionId: number,
  order: number,
): WireChatMessage => ({
  // Dữ liệu seed dùng id chuỗi (vd 's1-u') → fallback số duy nhất theo phiên/thứ tự.
  id: Number.isFinite(Number(m.id)) ? Number(m.id) : sessionId * 100000 + order,
  sessionId,
  senderType: m.role === 'user' ? 'USER' : 'ASSISTANT',
  messageOrder: order,
  content: m.content,
  status: 'COMPLETED',
  noAnswer: m.role === 'assistant' && (m.citations?.length ?? 0) === 0,
  clientRequestId: null,
  errorCode: null,
  completedAt: m.createdAt,
  createdAt: m.createdAt,
  citations: m.citations ?? [],
})

/** Lưu tin nhắn vào kho dùng chung + cập nhật phiên (để màn Lịch sử phản ánh đúng). */
const appendMessage = (sessionId: string, message: ChatMessage) => {
  mockChatMessages[sessionId] = [...(mockChatMessages[sessionId] ?? []), message]
  const session = mockChatSessions.find((s) => String(s.id) === sessionId)
  if (session) {
    session.updatedAt = message.createdAt
    session.lastMessageAt = message.createdAt
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
      lastMessageAt: null,
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

  // POST /api/chat/sessions/{id}/messages — gửi câu hỏi (chỉ text, đồng bộ). Trả 200 kèm
  // assistantMessage COMPLETED. Upload ảnh (UC 11) chưa được BE hỗ trợ (chốt B7).
  http.post(`${API}/chat/sessions/:id/messages`, async ({ request, params }) => {
    const sessionId = String(params.id)
    const sessionIdNum = Number(sessionId)
    const { content, clientRequestId } = (await request.json()) as SendMessageRequest
    const q = content.toLowerCase()

    // Mô phỏng RAG lỗi để test exception flow (UC 7) → 502.
    if (q.includes('timeout')) {
      await delay(500)
      return fail(502, 'RAG_UNAVAILABLE', 'Trợ lý AI đang bận, vui lòng thử lại sau giây lát.')
    }

    await delay(900) // mô phỏng độ trễ RAG
    const now = new Date().toISOString()

    // Lưu câu hỏi của người dùng (để Lịch sử — UC 9 — có nội dung).
    const userMessage: ChatMessage = {
      id: genMessageId(),
      role: 'user',
      content,
      createdAt: now,
    }
    appendMessage(sessionId, userMessage)

    // Trả lời: trong phạm vi → kèm trích dẫn; ngoài phạm vi → không bịa, không trích dẫn.
    const inScope = !OUT_OF_SCOPE.some((k) => q.includes(k))
    const assistantMessage: ChatMessage = {
      id: genMessageId(),
      role: 'assistant',
      content: inScope
        ? [
            'Dựa trên tài liệu môn học, đây là nội dung liên quan đến câu hỏi của bạn:',
            '',
            `"${content.trim()}"`,
            '',
            'Nội dung được tổng hợp từ các đoạn tài liệu trích dẫn bên dưới. Bạn có thể mở nguồn gốc để đối chiếu.',
          ].join('\n')
        : 'Xin lỗi, mình không tìm thấy thông tin liên quan trong tài liệu môn học để trả lời câu hỏi này.',
      citations: inScope
        ? [
            { id: 1, documentId: 1, documentTitle: MOCK_DOC_TITLE, pageNumber: 3, sourceText: PAGE3_TEXT },
            { id: 2, documentId: 1, documentTitle: MOCK_DOC_TITLE, pageNumber: 2, sourceText: 'Bài giảng AI cơ bản' },
          ]
        : [],
      createdAt: now,
    }
    appendMessage(sessionId, assistantMessage)

    const order = (mockChatMessages[sessionId]?.length ?? 1) - 1
    const response: SendMessageResponse = {
      duplicate: false,
      clientRequestId,
      userMessageId: Number(userMessage.id),
      assistantMessage: toWireMessage(assistantMessage, sessionIdNum, order),
    }
    return ok(response)
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
