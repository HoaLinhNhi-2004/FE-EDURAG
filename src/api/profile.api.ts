import { apiClient } from './client'
import type { ApiResponse, ChangePasswordRequest, UpdateProfileRequest, User } from '@/types'

/** Chuyển đổi dữ liệu profile từ snake_case của BE sang camelCase của FE */
function mapBackendUser(data: any): User {
  if (!data) return data
  return {
    id: data.id,
    fullName: data.fullName ?? data.full_name ?? '',
    email: data.email,
    role: data.role,
    status: data.status,
    authVersion: data.authVersion ?? data.auth_version ?? 0,
    phone: data.phone,
    studentCode: data.studentCode ?? data.student_code,
    dateOfBirth: data.dateOfBirth ?? data.date_of_birth,
    academicTitle: data.academicTitle ?? data.academic_title,
    degree: data.degree ?? data.degree,
    department: data.department ?? data.department,
    assignedCourses: data.assignedCourses ?? data.assigned_courses,
    joinDate: data.joinDate ?? data.created_at,
    documentCount: data.documentCount ?? data.document_count,
  }
}

// /api/profile — xem/cập nhật hồ sơ và đổi mật khẩu (UC 4, 5, 6).
export const profileApi = {
  // GET /api/profile — cũng dùng để khôi phục phiên đăng nhập.
  me: () => apiClient.get<ApiResponse<any>>('/profile').then((r) => mapBackendUser(r.data.data)),

  update: (body: UpdateProfileRequest) =>
    apiClient.put<ApiResponse<any>>('/profile', body).then((r) => mapBackendUser(r.data.data)),

  // PUT /api/profile/password — đổi mật khẩu và vô hiệu JWT cũ.
  changePassword: (body: ChangePasswordRequest) =>
    apiClient.put<ApiResponse<null>>('/profile/password', body).then((r) => r.data),
}
