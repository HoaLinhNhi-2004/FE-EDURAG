import { apiClient } from './client'
import type {
  ApiResponse,
  ChatMessage,
  ChatSession,
  CreateSessionRequest,
  SendMessageRequest,
} from '@/types'

// /api/chat/sessions — tạo phiên và gửi câu hỏi tới RAG (UC 7).
export const chatApi = {
  createSession: (body: CreateSessionRequest = {}) =>
    apiClient.post<ApiResponse<ChatSession>>('/chat/sessions', body).then((r) => r.data.data),

  // Trả về message của trợ lý (kèm citations). Shape data là giả định — chờ BE xác nhận.
  sendMessage: (sessionId: number, body: SendMessageRequest) =>
    apiClient
      .post<ApiResponse<ChatMessage>>(`/chat/sessions/${sessionId}/messages`, body)
      .then((r) => r.data.data),
}
