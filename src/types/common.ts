/** Kiểu chung cho toàn bộ response API — chốt lại với BE ở task 3.1 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

/** Lỗi đã được chuẩn hóa bởi interceptor trong api/client.ts */
export interface ApiError {
  status: number | null
  code: string
  message: string
}
