import { apiClient } from './client'
import { mapBackendUser, type RawUser } from './user.mapper'
import type {
  ApiResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResult,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from '@/types'

/** Phản hồi đăng nhập thô: user có thể ở dạng snake_case của BE (xem user.mapper). */
type RawLoginResult = { token: string; user?: RawUser | null } | { requireOtp: true }

/**
 * Chuẩn hóa user kèm trong phản hồi đăng nhập — nếu bỏ qua bước này thì
 * `user.fullName` sẽ undefined ngay sau khi đăng nhập khi BE trả snake_case.
 * Nhánh OTP của Admin (UC 19) không có user nên giữ nguyên.
 */
function mapLoginResult(raw: RawLoginResult): LoginResult {
  if (!('token' in raw)) return { requireOtp: true }
  return { token: raw.token, user: mapBackendUser(raw.user) ?? undefined }
}

// Path khớp OpenAPI (server base .../api). Đổi mật khẩu & profile ở profile.api.ts.
export const authApi = {
  // POST /api/auth/register — STUDENT → ACTIVE, TEACHER → PENDING (không trả JWT).
  register: (body: RegisterRequest) =>
    apiClient.post<ApiResponse<{ id?: number }>>('/auth/register', body).then((r) => r.data),

  // POST /api/auth/login — trả JWT (STUDENT/TEACHER) hoặc yêu cầu OTP (ADMIN).
  login: (body: LoginRequest) =>
    apiClient
      .post<ApiResponse<RawLoginResult>>('/auth/login', body)
      .then((r) => mapLoginResult(r.data.data)),

  // POST /api/auth/admin/verify-otp — bước 2FA của Admin (UC 19).
  verifyOtp: (body: VerifyOtpRequest) =>
    apiClient
      .post<ApiResponse<RawLoginResult>>('/auth/admin/verify-otp', body)
      .then((r) => mapLoginResult(r.data.data)),

  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout').then((r) => r.data),

  // POST /api/auth/forgot-password — luôn trả thành công, không tiết lộ email tồn tại.
  // BE gửi email kèm link chứa token (hạn 15'); không có bước OTP.
  forgotPassword: (body: ForgotPasswordRequest) =>
    apiClient.post<ApiResponse<null>>('/auth/forgot-password', body).then((r) => r.data),

  // POST /api/auth/reset-password — token lấy từ link trong email (?token=) + mật khẩu mới.
  resetPassword: (body: ResetPasswordRequest) =>
    apiClient.post<ApiResponse<null>>('/auth/reset-password', body).then((r) => r.data),
}
