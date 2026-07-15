import { apiClient } from './client'
import type {
  ApiResponse,
  ChatMessage,
  ChatSession,
  CreateSessionRequest,
  SendMessageRequest,
} from '@/types'

// /api/chat/sessions — tạo phiên và gửi câu hỏi tới RAG (UC 7, UC 11).
export const chatApi = {
  createSession: (body: CreateSessionRequest = {}) =>
    apiClient.post<ApiResponse<ChatSession>>('/chat/sessions', body).then((r) => r.data.data),

  /**
   * Gửi tin nhắn. Nếu có ảnh (UC 11) → gửi multipart (content + clientRequestId + image).
   * GIẢ ĐỊNH: OpenAPI hiện chỉ mô tả body JSON, chưa có field ảnh — cần BE xác nhận
   * endpoint/định dạng thật (multipart? base64? content có còn bắt buộc?).
   */
  sendMessage: (sessionId: number, body: SendMessageRequest, image?: File) => {
    const url = `/chat/sessions/${sessionId}/messages`
    if (image) {
      const form = new FormData()
      form.append('content', body.content)
      form.append('clientRequestId', body.clientRequestId)
      form.append('image', image)
      return apiClient.post<ApiResponse<ChatMessage>>(url, form).then((r) => r.data.data)
    }
    return apiClient.post<ApiResponse<ChatMessage>>(url, body).then((r) => r.data.data)
  },
}
