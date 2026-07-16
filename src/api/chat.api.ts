import { apiClient } from './client'
import type {
  ApiResponse,
  ChatMessage,
  ChatSession,
  CreateSessionRequest,
  Paginated,
  SendMessageRequest,
} from '@/types'

// /api/chat/sessions — tạo phiên, gửi câu hỏi tới RAG (UC 7, UC 11) và lịch sử (UC 9).
export const chatApi = {
  createSession: (body: CreateSessionRequest = {}) =>
    apiClient.post<ApiResponse<ChatSession>>('/chat/sessions', body).then((r) => r.data.data),

  /** UC 9 — danh sách phiên chat của chính mình (mới nhất trước). */
  listSessions: () =>
    apiClient.get<ApiResponse<Paginated<ChatSession>>>('/chat/sessions').then((r) => r.data.data),

  /** UC 9 — nội dung một phiên (dùng để xem lại và chat tiếp). */
  getMessages: (sessionId: number) =>
    apiClient
      .get<ApiResponse<Paginated<ChatMessage>>>(`/chat/sessions/${sessionId}/messages`)
      .then((r) => r.data.data),

  /** UC 9 — xóa (soft-delete) một phiên. */
  deleteSession: (sessionId: number) =>
    apiClient.delete<void>(`/chat/sessions/${sessionId}`).then((r) => r.data),

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
