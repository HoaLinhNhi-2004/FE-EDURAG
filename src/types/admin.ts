import type { Role, UserStatus } from './auth'

/**
 * UC 13 — Bộ lọc dùng chung cho danh sách người dùng và xuất CSV.
 * 'ALL' là giá trị của UI, khi gọi API sẽ được bỏ khỏi query string.
 */
export interface AdminUserFilters {
  role?: 'ALL' | Role
  status?: 'ALL' | UserStatus
  search?: string
}
