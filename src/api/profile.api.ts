import { apiClient } from './client'
import type { ApiResponse, ChangePasswordRequest, UpdateProfileRequest, User } from '@/types'

// /api/profile — xem/cập nhật hồ sơ và đổi mật khẩu (UC 4, 5, 6).
export const profileApi = {
  // GET /api/profile — cũng dùng để khôi phục phiên đăng nhập.
  me: () => apiClient.get<ApiResponse<User>>('/profile').then((r) => r.data.data),

  update: (body: UpdateProfileRequest) =>
    apiClient.put<ApiResponse<User>>('/profile', body).then((r) => r.data.data),

  // PUT /api/profile/password — đổi mật khẩu và vô hiệu JWT cũ.
  changePassword: (body: ChangePasswordRequest) =>
    apiClient.put<ApiResponse<null>>('/profile/password', body).then((r) => r.data),
}
