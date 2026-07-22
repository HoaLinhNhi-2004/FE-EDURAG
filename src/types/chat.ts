/**
 * Types cho Chat AI (UC 7, UC 9, UC 10) — đã đối chiếu contract BE thật (chốt B7).
 * Có 2 lớp: "wire" (đúng shape BE trả) và "UI model" (dạng component dùng). Tầng
 * api/chat.api.ts map wire -> UI để component không phải biết cấu trúc BE.
 */

/**
 * Thẻ trích dẫn nguồn kèm câu trả lời (UC 7, UC 10) — khớp contract BE.
 * Citation trong chat/history KHÔNG có `originalAvailable`; khi click phải gọi
 * GET /citations/{id} để lấy field này rồi mới mở file gốc.
 * `sourceLocator` (toạ độ highlight) BE CHƯA implement (không cam kết) → highlight
 * best-effort qua `pageNumber` + `sourceText` trong text-layer PDF.js.
 */
export interface Citation {
  id: number
  /** Có thể null nếu tài liệu gốc đã bị xóa (BE SET NULL). */
  documentId: number | null
  documentTitle: string
  /** 1-based; null với TXT/DOCX dùng segment giả lập (không phải trang vật lý). */
  pageNumber: number | null
  sourceText: string
  citationOrder?: number
  sectionTitle?: string | null
  messageId?: number | null
  /** Có thể null nếu chunk đã bị xóa. */
  chunkId?: number | null
  /** BE chưa implement — luôn null hiện tại. Không phụ thuộc schema này. */
  sourceLocator?: unknown | null
  retrievalScore?: number | null
  rerankScore?: number | null
  /** Chỉ có ở GET /citations/{id}. */
  originalAvailable?: boolean
}

export type ChatSenderType = 'USER' | 'ASSISTANT'
export type ChatMessageStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

/** Message đúng shape BE trả (history + assistantMessage trong send). */
export interface WireChatMessage {
  id: number
  sessionId: number
  senderType: ChatSenderType
  messageOrder: number
  /** Có thể null khi message chưa hoàn tất/thất bại. */
  content: string | null
  status: ChatMessageStatus
  noAnswer: boolean
  clientRequestId: string | null
  errorCode: string | null
  completedAt: string | null
  createdAt: string
  /** Luôn là array, kể cả []. */
  citations: Citation[]
}

/** Model tin nhắn cho UI (đã map từ WireChatMessage; role thay cho senderType). */
export interface ChatMessage {
  id: string | number
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  createdAt: string
  /** Trạng thái xử lý (chỉ có với tin của trợ lý từ BE). */
  status?: ChatMessageStatus
  /** true = câu hỏi ngoài phạm vi tài liệu (UC 7 — không bịa). */
  noAnswer?: boolean
  /** Mã lỗi khi status = FAILED, để hiển thị đúng. */
  errorCode?: string
}

export interface ChatSession {
  id: number
  title: string
  createdAt: string
  updatedAt: string
  /** Thời điểm tin nhắn cuối trong phiên (BE cung cấp; dùng cho màn Lịch sử — UC 9). */
  lastMessageAt?: string | null
}

/** Response GET /chat/sessions — BE dùng offset/limit + mảng `sessions`. */
export interface SessionsPage {
  sessions: ChatSession[]
  offset: number
  limit: number
  total: number
}

/** Response GET /chat/sessions/{id}/messages — mảng `messages` + phiên. */
export interface MessagesPage {
  session: ChatSession
  messages: WireChatMessage[]
  offset: number
  limit: number
  total: number
}

/** Response POST /chat/sessions/{id}/messages (đồng bộ — chốt B7). */
export interface SendMessageResponse {
  duplicate: boolean
  clientRequestId: string
  userMessageId: number
  assistantMessage: WireChatMessage
}

/** Kết quả gửi tin đã map cho UI (assistantMessage ở dạng ChatMessage). */
export interface SendResult {
  duplicate: boolean
  userMessageId: number
  assistantMessage: ChatMessage
}

export interface CreateSessionRequest {
  title?: string
}

/** POST /chat/sessions/{id}/messages — chỉ text (upload ảnh UC 11 chưa được BE hỗ trợ). */
export interface SendMessageRequest {
  content: string
  clientRequestId: string // uuid
}

/** UC 8 — Tìm kiếm ngữ nghĩa (mock của LN Long). */
export interface SearchRequest {
  query: string
}

export interface SearchResult {
  documentId: number
  documentName: string
  page: number
  snippet: string
  score: number
}
