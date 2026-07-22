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
  /** Các môn học (mã môn) mà TEACHER được phân công phụ trách. */
  assignedCourses?: string[]
  /** Ngày tham gia hệ thống (ISO 8601 string) */
  joinDate?: string
  /** Số lượng tài liệu đã upload */
  documentCount?: number
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
 * POST /api/auth/reset-password — luồng quên mật khẩu 1 bước (đã chốt B7):
 * token lấy từ link trong email (query param ?token=), KHÔNG qua bước OTP.
 */
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
