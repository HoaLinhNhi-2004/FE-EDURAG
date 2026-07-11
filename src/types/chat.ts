/**
 * Thẻ trích dẫn nguồn kèm câu trả lời RAG (UC 7, UC 10).
 * boundingBox dùng để highlight đoạn văn trong PDF viewer —
 * format cần BE xác nhận ở task 3.1 (Vector DB có lưu bounding box coordinates).
 */
export interface Citation {
  documentId: string
  documentName: string
  page: number
  snippet: string
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  createdAt: string
}

/** Phiên chat trong sidebar Lịch sử trò chuyện (UC 9) */
export interface ChatSession {
  id: string
  title: string
  updatedAt: string
}

export interface AskRequest {
  sessionId?: string // bỏ trống = tạo phiên mới
  question: string
}

export interface AskResponse {
  sessionId: string
  message: ChatMessage
}

/** UC 8 — tìm kiếm ngữ nghĩa */
export interface SearchRequest {
  query: string
}

export interface SearchResult {
  documentId: string
  documentName: string
  page: number
  snippet: string
  score: number
}
