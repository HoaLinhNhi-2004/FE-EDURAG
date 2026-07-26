import { apiClient } from './client'
import type {
  ApiResponse,
  LibraryDocument,
  LibraryListParams,
  LibraryListResponse,
} from '@/types'

// /api/library/documents — Thư viện tài liệu (xem/tải). Tách khỏi API quản lý.
export const libraryApi = {
  /** Danh sách tài liệu eligible (visible+ready). Chỉ hỗ trợ offset/limit/search. */
  list: (params: LibraryListParams = {}) =>
    apiClient
      .get<ApiResponse<LibraryListResponse>>('/library/documents', { params })
      .then((r) => r.data.data),

  /** Chi tiết một tài liệu (BE bọc trong { document }). */
  getDocument: (id: number) =>
    apiClient
      .get<ApiResponse<{ document: LibraryDocument }>>(`/library/documents/${id}`)
      .then((r) => r.data.data.document),

  /**
   * Tải file gốc dạng Blob để xem (PDF) hoặc tải xuống (BE trả stream, attachment).
   * Lỗi 409 ORIGINAL_SOURCE_UNAVAILABLE = file gốc không khả dụng.
   */
  openSource: (id: number) =>
    apiClient.get(`/library/documents/${id}/source`, { responseType: 'blob' }).then((r) => ({
      blob: r.data as Blob,
      contentType: (r.headers['content-type'] as string) ?? '',
    })),
}
