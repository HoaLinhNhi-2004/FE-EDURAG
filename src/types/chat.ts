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
  citations?: Citation[]
  createdAt: string
}

export interface ChatSession {
  id: number
  title: string
  createdAt: string
  updatedAt: string
}

export interface CreateSessionRequest {
  title?: string
}

/** POST /chat/sessions/{id}/messages */
export interface SendMessageRequest {
  content: string
  clientRequestId: string // uuid
}
