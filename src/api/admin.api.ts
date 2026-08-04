import { apiClient } from './client'
import type { AdminUserFilters } from '@/types'

/** Bỏ các filter đang để 'ALL'/rỗng để không gửi tham số thừa lên BE. */
function toQueryParams({ role, status, search }: AdminUserFilters) {
  const params: Record<string, string> = {}
  if (role && role !== 'ALL') params.role = role
  if (status && status !== 'ALL') params.status = status
  const keyword = search?.trim()
  if (keyword) params.search = keyword
  return params
}

// /api/admin — các endpoint quản trị người dùng (UC 13).
export const adminApi = {
  // GET /api/admin/users/export — tải file CSV danh sách người dùng theo bộ lọc hiện tại.
  // Đi qua apiClient để JWT tự gắn và 401 được interceptor đưa về /login.
  exportUsersCsv: (filters: AdminUserFilters) =>
    apiClient
      .get('/admin/users/export', {
        params: toQueryParams(filters),
        responseType: 'blob',
      })
      .then((r) => r.data as Blob),
}
