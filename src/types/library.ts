/**
 * Types cho Thư viện tài liệu (Library) — khớp contract BE thật (repo NodeJS,
 * src/services/library-service.js). API library TÁCH khỏi API quản lý tài liệu:
 * chỉ trả tài liệu eligible (visible + ready), cho cả STUDENT/GV/ADMIN.
 */

/** Một tài liệu trong thư viện (publicDocument từ BE). */
export interface LibraryDocument {
  id: number
  title: string
  /** pdf | docx | pptx | txt ... (document.file_type) */
  fileType: string
  /** Kích thước file (bytes). */
  fileSize: number
  /** BE hiện luôn null. */
  pageCount: number | null
  createdAt: string
  /** File gốc có sẵn trong kho để mở/tải không. */
  originalAvailable: boolean
}

/** GET /api/library/documents — chỉ hỗ trợ offset/limit/search (không lọc môn/loại). */
export interface LibraryListParams {
  offset?: number
  limit?: number
  search?: string
}

/** Response list — mảng nằm ở key `documents`. */
export interface LibraryListResponse {
  offset: number
  limit: number
  total: number
  documents: LibraryDocument[]
}
