import { http, HttpResponse, delay } from 'msw'
import type { ChatMessage, ChatSession, SendMessageRequest } from '@/types'

const API = import.meta.env.VITE_API_BASE_URL

const ok = <T>(data: T, status = 200) =>
  HttpResponse.json({ success: true, message: 'OK', data }, { status })
const fail = (status: number, errorCode: string, message: string) =>
  HttpResponse.json({ success: false, message, errorCode }, { status })

let sessionSeq = 1000
let messageSeq = 5000

// Từ khóa mô phỏng câu hỏi ngoài phạm vi tài liệu (UC 7: không bịa câu trả lời).
const OUT_OF_SCOPE = ['thời tiết', 'bóng đá', 'nấu ăn', 'crypto', 'chứng khoán']

export const chatHandlers = [
  // POST /api/chat/sessions — tạo phiên chat mới.
  http.post(`${API}/chat/sessions`, async ({ request }) => {
    await delay(150)
    const body = (await request.json().catch(() => ({}))) as { title?: string }
    const now = new Date().toISOString()
    const session: ChatSession = {
      id: ++sessionSeq,
      title: body.title ?? 'Cuộc trò chuyện mới',
      createdAt: now,
      updatedAt: now,
    }
    return ok(session, 201)
  }),

  // POST /api/chat/sessions/{id}/messages — gửi câu hỏi (text hoặc ảnh), nhận câu trả lời RAG.
  http.post(`${API}/chat/sessions/:id/messages`, async ({ request }) => {
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

    // UC 11 — ảnh: mô phỏng OCR fail nếu tên file gợi ý ảnh mờ; ngược lại trả tài liệu khớp.
    if (imageName) {
      if (/mo|blur|nhoe/i.test(imageName)) {
        return ok<ChatMessage>({
          id: ++messageSeq,
          role: 'assistant',
          content:
            'Ảnh chưa đủ rõ để nhận diện nội dung (OCR không đọc được chữ). Vui lòng chụp lại rõ nét hơn.',
          citations: [],
          createdAt: now,
        })
      }
      return ok<ChatMessage>({
        id: ++messageSeq,
        role: 'assistant',
        content:
          'Mình đã phân tích nội dung trong ảnh và tìm thấy các tài liệu liên quan trong kho học liệu:',
        citations: [
          {
            id: 3,
            documentId: 10,
            documentName: 'Slide.pdf',
            page: 6,
            snippet: 'Nội dung khớp với hình ảnh bạn tải lên.',
          },
        ],
        createdAt: now,
      })
    }

    // Ngoài phạm vi tài liệu → không bịa, không kèm trích dẫn.
    if (OUT_OF_SCOPE.some((k) => q.includes(k))) {
      const message: ChatMessage = {
        id: ++messageSeq,
        role: 'assistant',
        content:
          'Xin lỗi, mình không tìm thấy thông tin liên quan trong tài liệu môn học để trả lời câu hỏi này.',
        citations: [],
        createdAt: now,
      }
      return ok(message)
    }

    // Trong phạm vi → trả lời kèm ít nhất 1 trích dẫn (UC 7).
    const message: ChatMessage = {
      id: ++messageSeq,
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
          documentId: 10,
          documentName: 'Slide.pdf',
          page: 6,
          snippet: '5 thành phần cốt lõi: GUI, Core, Wiretap Library, Dissectors, Capture Engine.',
        },
        {
          id: 2,
          documentId: 10,
          documentName: 'Slide.pdf',
          page: 7,
          snippet: 'Kiến trúc hệ thống và luồng xử lý gói tin.',
        },
      ],
      createdAt: now,
    }
    return ok(message)
  }),
]
