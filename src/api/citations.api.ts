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
   */
  getCitationFile: (id: number) =>
    apiClient.get(`/citations/${id}/file`, { responseType: 'blob' }).then((r) => ({
      blob: r.data as Blob,
      contentType: (r.headers['content-type'] as string) ?? '',
    })),
}
