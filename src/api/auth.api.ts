import { apiClient } from './client'
import type {
  ApiResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResult,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from '@/types'

// Path khớp OpenAPI (server base .../api). Đổi mật khẩu & profile ở profile.api.ts.
export const authApi = {
  // POST /api/auth/register — STUDENT → ACTIVE, TEACHER → PENDING (không trả JWT).
  register: (body: RegisterRequest) =>
    apiClient.post<ApiResponse<{ id?: number }>>('/auth/register', body).then((r) => r.data),

  // POST /api/auth/login — trả JWT (STUDENT/TEACHER) hoặc yêu cầu OTP (ADMIN).
  login: (body: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResult>>('/auth/login', body).then((r) => r.data.data),

  // POST /api/auth/admin/verify-otp — bước 2FA của Admin (UC 19).
  verifyOtp: (body: VerifyOtpRequest) =>
    apiClient.post<ApiResponse<LoginResult>>('/auth/admin/verify-otp', body).then((r) => r.data.data),

  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout').then((r) => r.data),

  forgotPassword: (body: ForgotPasswordRequest) =>
    apiClient.post<ApiResponse<null>>('/auth/forgot-password', body).then((r) => r.data),

  resetPassword: (body: ResetPasswordRequest) =>
    apiClient.post<ApiResponse<null>>('/auth/reset-password', body).then((r) => r.data),
}
