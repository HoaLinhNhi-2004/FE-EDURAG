export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN'
export type UserStatus = 'PENDING' | 'ACTIVE' | 'LOCKED' | 'REJECTED'

export interface User {
  id: number
  fullName: string
  email: string
  role: Role
  status: UserStatus
  /** Version auth — tăng khi đổi mật khẩu để vô hiệu JWT cũ. */
  authVersion: number
  phone?: string | null
  /** Chỉ với STUDENT; readonly sau đăng ký (UC 5). */
  studentCode?: string
  dateOfBirth?: string // ISO yyyy-MM-dd
  /** Các trường của TEACHER (UC 15). */
  academicTitle?: string | null
  degree?: string | null
  department?: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

/** Login trả JWT cho STUDENT/TEACHER (ACTIVE); ADMIN nhận requireOtp (UC 19). */
export interface LoginResponse {
  token: string
  user: User
}

export interface AdminOtpChallenge {
  requireOtp: true
}

export type LoginResult = LoginResponse | AdminOtpChallenge

/** POST /api/auth/register — gộp Student & Teacher, phân biệt bằng `role`. */
export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  phone?: string
  role: 'STUDENT' | 'TEACHER'
  studentCode?: string // bắt buộc với STUDENT
  dateOfBirth?: string // bắt buộc với STUDENT
  academicTitle?: string
  degree?: string
  department?: string
}

export interface ForgotPasswordRequest {
  email: string
}

/**
 * POST /api/auth/verify-reset-otp — xác thực OTP quên mật khẩu, đổi lấy resetToken.
 * GIẢ ĐỊNH: endpoint này CHƯA có trong OpenAPI (reset hiện 1 bước bằng token) —
 * cần BE bổ sung cho luồng OTP 2 bước.
 */
export interface VerifyResetOtpRequest {
  email: string
  otpCode: string
}

export interface VerifyResetOtpResponse {
  resetToken: string
}

/** POST /api/auth/reset-password — dùng resetToken (từ bước verify OTP) + mật khẩu mới. */
export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

/** PUT /api/profile/password */
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

/** PUT /api/profile — MSV & email không nằm trong đây (không cho sửa). */
export interface UpdateProfileRequest {
  fullName?: string
  phone?: string
  dateOfBirth?: string
  academicTitle?: string
  degree?: string
  department?: string
}

/** POST /api/auth/admin/verify-otp — OTP 6 chữ số. */
export interface VerifyOtpRequest {
  email: string
  otpCode: string
}
