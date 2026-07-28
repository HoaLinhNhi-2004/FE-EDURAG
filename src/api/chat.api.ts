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

/**
 * Map message từ BE sang model UI.
 * Xử lý 2 case:
 * 1. WireChatMessage đầy đủ (từ getHistory) — có senderType, createdAt
 * 2. assistantMessage rút gọn (từ sendMessage) — chỉ có id, status, content, noAnswer, citations
 *    → không có senderType nên luôn map về 'assistant'
 */
function toChatMessage(w: WireChatMessage | (Partial<WireChatMessage> & { id: number })): ChatMessage {
  // assistantMessage rút gọn từ sendMessage không có senderType → luôn là assistant
  const senderType = (w as WireChatMessage).senderType
  const role: 'user' | 'assistant' = senderType === 'USER' ? 'user' : 'assistant'

  // noAnswer = true → hiển thị thông báo phù hợp thay vì content rỗng
  const raw = w as WireChatMessage & { noAnswer?: boolean }
  const content =
    raw.noAnswer === true && !w.content
      ? 'Câu hỏi này nằm ngoài phạm vi tài liệu hiện có. Vui lòng hỏi về nội dung trong học liệu.'
      : (w.content ?? '')

  return {
    id: w.id,
    role,
    content,
    citations: (w as WireChatMessage).citations ?? [],
    createdAt: (w as WireChatMessage).createdAt ?? new Date().toISOString(),
    status: (w as WireChatMessage).status,
    noAnswer: raw.noAnswer,
    errorCode: (w as WireChatMessage).errorCode ?? undefined,
  }
}

// /api/chat/sessions — tạo phiên, gửi câu hỏi tới RAG (UC 7) và lịch sử (UC 9).
export const chatApi = {
  /** BE trả 201 Created khi tạo session thành công. */
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

  /** UC 9 — xóa (soft-delete) một phiên. BE trả 204 No Content. */
  deleteSession: (sessionId: number) =>
    apiClient.delete<void>(`/chat/sessions/${sessionId}`).then((r) => r.data),

  /**
   * Gửi câu hỏi (đồng bộ — chốt B7): BE trả 200 kèm assistantMessage COMPLETED.
   *
   * Timeout riêng 120s vì RAG call thật (embedding + rerank + LLM) có thể lâu hơn
   * default 30s của apiClient. Ảnh (UC 11) chưa được BE hỗ trợ nên chỉ gửi text.
   *
   * assistantMessage từ endpoint này là object rút gọn: { id, status, content, noAnswer, citations }
   * Không có senderType/sessionId/messageOrder — toChatMessage xử lý đúng case này.
   */
  sendMessage: (sessionId: number, body: SendMessageRequest): Promise<SendResult> =>
    apiClient
      .post<ApiResponse<SendMessageResponse>>(`/chat/sessions/${sessionId}/messages`, body, {
        timeout: 120_000, // 2 phút — đủ cho RAG call thật
      })
      .then((r) => {
        const d = r.data.data
        return {
          duplicate: d.duplicate,
          userMessageId: d.userMessageId,
          assistantMessage: toChatMessage(d.assistantMessage),
        }
      }),
}
