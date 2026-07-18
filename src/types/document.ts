/** Trạng thái pipeline xử lý tài liệu sau upload (UC 18, UC 22) */
export type IndexStatus = 'queued' | 'ocr' | 'parsing' | 'indexing' | 'ready' | 'failed'

export interface CourseDocument {
  /** Khớp OpenAPI: id tài liệu là integer (cùng kiểu với Citation.documentId). */
  id: number
  name: string
  fileType: 'pdf' | 'docx' | 'pptx'
  courseId: string
  courseName: string
  sizeBytes: number
  status: IndexStatus
  hidden: boolean
  uploadedBy: string
  uploadedAt: string
  currentVersion: number
  // ─── Metadata ───────────────────────────────────────────────────────────────
  /** Tên hiển thị của tài liệu (có thể khác tên file) */
  title?: string
  /** Tác giả / nhóm tác giả */
  author?: string
  /** Loại tài liệu */
  docType?: string
  /** Năm xuất bản */
  publishYear?: number
  /** Tóm tắt nội dung */
  abstract?: string
}

/** UC 17 — version history + rollback */
export interface DocumentVersion {
  version: number
  uploadedAt: string
  uploadedBy: string
  note?: string
}

/** Payload gửi khi upload tài liệu mới (form + file). */
export interface UploadDocumentRequest {
  file: File
  courseId: string
  title?: string
  author?: string
  docType?: string
  publishYear?: number
  abstract?: string
}
