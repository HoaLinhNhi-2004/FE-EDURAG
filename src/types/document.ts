/** Trạng thái pipeline xử lý tài liệu sau upload (UC 18, UC 22) */
export type IndexStatus = 'queued' | 'ocr' | 'parsing' | 'indexing' | 'ready' | 'failed'

export interface CourseDocument {
  id: string
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
}

/** UC 17 — version history + rollback */
export interface DocumentVersion {
  version: number
  uploadedAt: string
  uploadedBy: string
  note?: string
}
