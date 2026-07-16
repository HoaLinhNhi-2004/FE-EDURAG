/**
 * Types cho Chat AI (UC 7). LƯU Ý: OpenAPI để `data` generic nên shape response
 * chat (message + citations) là GIẢ ĐỊNH, cần đối chiếu BE khi integration.
 */

/** Thẻ trích dẫn nguồn kèm câu trả lời (UC 7). boundingBox bổ sung khi làm PDF Viewer (UC 10). */
export interface Citation {
  id: number
  documentId: number
  documentName: string
  page: number
  snippet: string
}

export interface ChatMessage {
  id: string | number
  role: 'user' | 'assistant'
  content: string
  /** URL ảnh đính kèm (UC 11) — client dùng object URL để hiển thị tin của chính mình. */
  imageUrl?: string
  citations?: Citation[]
  createdAt: string
}

export interface ChatSession {
  id: number
  title: string
  createdAt: string
  updatedAt: string
  /**
   * Đoạn xem trước + số tin nhắn để hiển thị ở màn Lịch sử (UC 9).
   * GIẢ ĐỊNH: OpenAPI để `data` generic nên 2 field này chưa được đặc tả — cần BE xác nhận.
   */
  preview?: string
  messageCount?: number
}

export interface CreateSessionRequest {
  title?: string
}

/** POST /chat/sessions/{id}/messages */
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

