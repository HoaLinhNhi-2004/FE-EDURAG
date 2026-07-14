/** Kiểu chung cho toàn bộ response API. */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/** Phân trang: BE dùng offset/limit (documents, chat). Admin users dùng page/limit. */
export interface Paginated<T> {
  items: T[]
  total: number
  offset: number
  limit: number
}

/** Lỗi đã được chuẩn hóa bởi interceptor trong api/client.ts. */
export interface ApiError {
  status: number | null
  /** Lấy từ `errorCode` trong response lỗi của BE. */
  code: string
  message: string
}
