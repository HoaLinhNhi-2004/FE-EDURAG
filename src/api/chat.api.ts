import { apiClient } from './client'
import type {
  ApiResponse,
  ChatMessage,
  ChatSession,
  CreateSessionRequest,
  MessagesPage,
  Paginated,
  SendMessageRequest,
  SendMessageResponse,
  SendResult,
  SessionsPage,
  WireChatMessage,
} from '@/types'

/** Map message dạng BE (senderType) sang model UI (role). */
function toChatMessage(w: WireChatMessage): ChatMessage {
  return {
    id: w.id,
    role: w.senderType === 'USER' ? 'user' : 'assistant',
    content: w.content ?? '',
    citations: w.citations ?? [],
    createdAt: w.createdAt,
    status: w.status,
    noAnswer: w.noAnswer,
    errorCode: w.errorCode ?? undefined,
  }
}

// /api/chat/sessions — tạo phiên, gửi câu hỏi tới RAG (UC 7) và lịch sử (UC 9).
export const chatApi = {
  createSession: (body: CreateSessionRequest = {}) =>
    apiClient.post<ApiResponse<ChatSession>>('/chat/sessions', body).then((r) => r.data.data),

  /** UC 9 — danh sách phiên của chính mình. BE trả {offset,limit,total,sessions}. */
  listSessions: (): Promise<Paginated<ChatSession>> =>
    apiClient.get<ApiResponse<SessionsPage>>('/chat/sessions').then((r) => {
      const { sessions, total, offset, limit } = r.data.data
      return { items: sessions, total, offset, limit }
    }),

  /** UC 9 — nội dung một phiên (đã map sang model UI, đúng thứ tự messageOrder). */
  getMessages: (sessionId: number): Promise<ChatMessage[]> =>
    apiClient
      .get<ApiResponse<MessagesPage>>(`/chat/sessions/${sessionId}/messages`)
      .then((r) => r.data.data.messages.map(toChatMessage)),

  /** UC 9 — xóa (soft-delete) một phiên. */
  deleteSession: (sessionId: number) =>
    apiClient.delete<void>(`/chat/sessions/${sessionId}`).then((r) => r.data),

  /**
   * Gửi câu hỏi (đồng bộ — chốt B7): BE trả 200 kèm assistantMessage COMPLETED.
   * Ảnh (UC 11) chưa được BE hỗ trợ nên chỉ gửi text.
   */
  sendMessage: (sessionId: number, body: SendMessageRequest): Promise<SendResult> =>
    apiClient
      .post<ApiResponse<SendMessageResponse>>(`/chat/sessions/${sessionId}/messages`, body)
      .then((r) => {
        const d = r.data.data
        return {
          duplicate: d.duplicate,
          userMessageId: d.userMessageId,
          assistantMessage: toChatMessage(d.assistantMessage),
        }
      }),
}
