import { apiClient } from './client'
import { mapBackendUser, type RawUser } from './user.mapper'
import type { ApiResponse, ChangePasswordRequest, UpdateProfileRequest } from '@/types'

// /api/profile — xem/cập nhật hồ sơ và đổi mật khẩu (UC 4, 5, 6).
export const profileApi = {
  // GET /api/profile — cũng dùng để khôi phục phiên đăng nhập.
  me: () =>
    apiClient.get<ApiResponse<RawUser>>('/profile').then((r) => mapBackendUser(r.data.data)),

  update: (body: UpdateProfileRequest) =>
    apiClient.put<ApiResponse<RawUser>>('/profile', body).then((r) => mapBackendUser(r.data.data)),

  // PUT /api/profile/password — đổi mật khẩu và vô hiệu JWT cũ.
  changePassword: (body: ChangePasswordRequest) =>
    apiClient.put<ApiResponse<null>>('/profile/password', body).then((r) => r.data),
}
