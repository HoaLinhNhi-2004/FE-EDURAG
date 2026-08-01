/**
 * Trạng thái pipeline xử lý tài liệu sau upload (UC 18, UC 22).
 * Giá trị viết thường — BE trả UPPERCASE, `toCourseDocument` trong
 * `api/documents.api.ts` chuẩn hóa lại.
 */
export type IndexStatus =
  | 'queued'
  | 'uploaded'
  | 'processing'
  | 'ocr'
  | 'parsing'
  | 'indexing'
  | 'ready'
  | 'failed'
  | 'cancelled'

export interface CourseDocument {
  /** Khớp OpenAPI: id tài liệu là integer (cùng kiểu với Citation.documentId). */
  id: number
  name: string
  fileType: 'pdf' | 'docx' | 'pptx' | 'txt'
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

// ─── Hợp đồng với BE (wire types) ─────────────────────────────────────────────
// Shape thật đã đối chiếu với BE đang chạy (GET /api/documents), giữ nguyên tên
// field của BE. Model UI là `CourseDocument` ở trên — map qua `toCourseDocument`.

/** Trạng thái xử lý BE trả về (UPPERCASE). */
export type WireProcessingStatus =
  | 'QUEUED' | 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED' | 'CANCELLED'

/** Trạng thái hiển thị BE trả về — HIDDEN nghĩa là đã ẩn khỏi thư viện & retrieval. */
export type WireVisibilityStatus = 'VISIBLE' | 'HIDDEN'

/** Một tài liệu như BE trả về. Các field nullable đúng theo response thật. */
export interface WireDocument {
  id: number
  title: string
  description: string | null
  author: string | null
  fileType: string
  fileSize: number
  fileSizeBytes?: number
  pageCount: number | null
  originalFilename: string | null
  mimeType: string | null
  previewAvailable?: boolean
  originalAvailable?: boolean
  processingStatus: WireProcessingStatus
  visibilityStatus: WireVisibilityStatus
  uploadedBy: number
  createdAt: string
  updatedAt: string
  processedAt: string | null
  deletedAt: string | null
}

/**
 * Response GET /documents (quản lý — Giảng viên/Admin) và GET /library/documents
 * (thư viện công khai). BE bọc trong `ApiResponse.data`.
 */
export interface DocumentsPage {
  documents: WireDocument[]
  total: number
  page: number
  limit: number
  offset: number
  totalPages: number
}

/** Payload POST /documents — multipart/form-data (UC 13 — tải lên học liệu). */
export interface UploadDocumentRequest {
  file: File
  title?: string
  author?: string
  /** BE nhận field `description`; UI gọi là "Mô tả tài liệu". */
  description?: string
}

/**
 * Response POST /documents. BE trả 202 Accepted: bản ghi đã tạo, việc trích xuất
 * và index chạy nền qua job → danh sách phải refetch mới thấy trạng thái cuối.
 * KHÔNG dựa vào shape này để dựng state UI (xem ghi chú ở documents.api.ts).
 */
export interface UploadDocumentResponse {
  document?: WireDocument
  job?: { id: number; status: string }
  previewJob?: { id: number; status: string }
}
