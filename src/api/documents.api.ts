import { apiClient } from './client'
import type {
  ApiResponse,
  CourseDocument,
  DocumentsPage,
  UploadDocumentRequest,
  UploadDocumentResponse,
  WireDocument,
} from '@/types'

/**
 * Map tài liệu từ BE sang model UI.
 * Hiển thị theo `title`; KHÔNG fallback về tên file gốc vì tên file có thể sai encoding.
 * `visibilityStatus === 'HIDDEN'` là nguồn sự thật duy nhất cho cờ `hidden`.
 */
export function toCourseDocument(d: WireDocument): CourseDocument {
  const fileType = (d.fileType ?? 'pdf').toLowerCase() as CourseDocument['fileType']

  return {
    id: d.id,
    name: d.originalFilename ?? d.title ?? 'Tài liệu',
    fileType,
    courseId: '',
    courseName: 'Môn học chung',
    sizeBytes: d.fileSize ?? d.fileSizeBytes ?? 0,
    status: (d.processingStatus ?? 'READY').toLowerCase() as CourseDocument['status'],
    hidden: d.visibilityStatus === 'HIDDEN',
    uploadedBy: String(d.uploadedBy ?? ''),
    uploadedAt: d.createdAt ?? new Date().toISOString(),
    currentVersion: 1,
    title: d.title ?? 'Tài liệu môn học',
    author: d.author ?? 'Giảng viên',
    docType: d.fileType ? `${d.fileType.toUpperCase()} Document` : 'Tài liệu',
    publishYear: undefined,
    abstract: d.description ?? '',
  }
}

/** Bóc danh sách tài liệu ra khỏi lớp bọc `ApiResponse.data`. */
function unwrapList(data: DocumentsPage): CourseDocument[] {
  return (data?.documents ?? []).map(toCourseDocument)
}

// /api/documents + /api/library/documents — quản lý học liệu (Giảng viên/Admin)
// và thư viện công khai (Sinh viên).
export const documentsApi = {
  /** Danh sách đầy đủ cho người quản lý — gồm cả tài liệu đang ẩn và đang xử lý. */
  listManaged: (): Promise<CourseDocument[]> =>
    apiClient.get<ApiResponse<DocumentsPage>>('/documents').then((r) => unwrapList(r.data.data)),

  /** Thư viện công khai — BE đã scope sẵn READY + VISIBLE + chưa xóa. */
  listLibrary: (): Promise<CourseDocument[]> =>
    apiClient
      .get<ApiResponse<DocumentsPage>>('/library/documents')
      .then((r) => unwrapList(r.data.data)),

  /**
   * UC 13 — tải lên học liệu. BE trả 202 (đã nhận, xử lý nền) hoặc 503 khi
   * dispatch sang RAG thất bại.
   *
   * Cố tình KHÔNG trả document đã map: shape `data.document` không được cam kết,
   * đọc trượt sẽ biến upload thành công thành lỗi và tài liệu chỉ hiện sau khi F5.
   * Nơi gọi phải refetch danh sách thay vì suy ra state từ response.
   *
   * Timeout 120s vì file được phép tới 50 MB, vượt mặc định 30s của apiClient.
   */
  upload: ({ file, title, author, description }: UploadDocumentRequest): Promise<void> => {
    const form = new FormData()
    form.append('file', file)
    if (title?.trim()) form.append('title', title.trim())
    if (author?.trim()) form.append('author', author.trim())
    if (description?.trim()) form.append('description', description.trim())

    return apiClient
      .post<ApiResponse<UploadDocumentResponse>>('/documents', form, { timeout: 120_000 })
      .then(() => undefined)
  },

  /**
   * Ẩn/hiện tài liệu. BE trả **202** và chạy job SET_RETRIEVAL nền — đã đối chiếu
   * với BE thật: GET /documents ngay sau đó vẫn trả visibility CŨ.
   * ⇒ nơi gọi phải cập nhật lạc quan và chờ một nhịp trước khi refetch.
   * Gọi lại khi job trước chưa xong sẽ nhận **409**.
   */
  setVisibility: (id: number, hidden: boolean): Promise<void> =>
    apiClient
      .post<ApiResponse<null>>(`/documents/${id}/${hidden ? 'hide' : 'unhide'}`)
      .then(() => undefined),

  /** Xóa tài liệu (Giảng viên/Admin). */
  remove: (id: number): Promise<void> =>
    apiClient.delete<void>(`/documents/${id}`).then(() => undefined),

  /**
   * Tải file gốc dạng binary → Blob (BE stream file, KHÔNG trả URL).
   * `managed` = true dùng endpoint quản lý (thấy được cả tài liệu đang ẩn),
   * ngược lại đi qua thư viện công khai.
   */
  downloadFile: (id: number, managed: boolean): Promise<Blob> =>
    apiClient
      .get(managed ? `/documents/${id}/file` : `/library/documents/${id}/source`, {
        responseType: 'blob',
      })
      .then((r) => r.data as Blob),
}
