import { apiClient } from './client'
import type { ApiResponse, Citation } from '@/types'

// /api/citations — chi tiết trích dẫn và file gốc phục vụ PDF Viewer (UC 10).
export const citationsApi = {
  /** Lấy chi tiết trích dẫn (gồm originalAvailable) trước khi mở file. */
  getCitation: (id: number) =>
    apiClient.get<ApiResponse<Citation>>(`/citations/${id}`).then((r) => r.data.data),

  /**
   * Tải file gốc dạng binary → Blob (BE trả stream, KHÔNG trả URL).
   * Chỉ gọi khi citation.originalAvailable === true. Lỗi 409 = file gốc không khả dụng.
   *
   * UC 10: chỉ dùng cho nút "Tải file gốc" — KHÔNG dùng để render. Việc render
   * đi qua getDocumentPreview (bản PDF chuẩn hóa) cho mọi định dạng.
   */
  getCitationFile: (id: number) =>
    apiClient.get(`/citations/${id}/file`, { responseType: 'blob' }).then((r) => ({
      blob: r.data as Blob,
      contentType: (r.headers['content-type'] as string) ?? '',
    })),

  /**
   * Bản PDF chuẩn hóa của tài liệu, dùng để render trong PDF Viewer (UC 10).
   * PDF gốc → BE stream nguyên bản; DOCX → BE trả bản PDF đã sinh sẵn lúc ingest.
   *
   * Nhận documentId (lấy từ `citation.documentId`), KHÔNG phải citationId.
   * Lỗi 409 PREVIEW_NOT_READY = chưa sinh xong hoặc định dạng không hỗ trợ (vd PPTX).
   * Lỗi 404 = tài liệu không tồn tại hoặc ngoài phạm vi thư viện công khai.
   */
  getDocumentPreview: (documentId: number) =>
    apiClient
      .get(`/library/documents/${documentId}/preview`, { responseType: 'blob' })
      .then((r) => r.data as Blob),
}
