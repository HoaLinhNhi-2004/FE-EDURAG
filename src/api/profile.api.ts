import { apiClient } from './client'
import { mapBackendUser, type RawUser } from './user.mapper'
import type { ApiResponse, ChangePasswordRequest, UpdateProfileRequest, AvatarDescriptor } from '@/types'

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

  // POST /api/profile/avatar — upload/thay thế avatar của chính mình
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiClient
      .post<ApiResponse<AvatarDescriptor>>('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((r) => r.data.data)
  },

  // GET /api/profile/avatar — tải stream file avatar (yêu cầu Bearer auth)
  getAvatarBlob: () =>
    apiClient
      .get('/profile/avatar', { responseType: 'blob' })
      .then((r) => r.data as Blob),

  // DELETE /api/profile/avatar — xóa avatar của chính mình
  deleteAvatar: () =>
    apiClient
      .delete<ApiResponse<AvatarDescriptor>>('/profile/avatar')
      .then((r) => r.data.data),
}
