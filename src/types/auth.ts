export type Role = 'student' | 'lecturer' | 'admin'

export interface User {
  id: string
  fullName: string
  email: string
  role: Role
  /** Mã số sinh viên — chỉ có với role student, readonly sau đăng ký (UC 5) */
  studentCode?: string
  dateOfBirth?: string // ISO yyyy-MM-dd
  phone?: string
  /** Học hàm/Học vị, Khoa — chỉ có với role lecturer (UC 15) */
  academicTitle?: string
  department?: string
  /** Giảng viên mới đăng ký ở trạng thái pending cho tới khi Admin duyệt (UC 12) */
  status: 'active' | 'pending' | 'locked'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}

/** UC 1 — đăng ký Sinh viên: email @student..., mật khẩu >=8 ký tự, MSV + ngày sinh bắt buộc */
export interface RegisterStudentRequest {
  fullName: string
  email: string
  password: string
  studentCode: string
  dateOfBirth: string
}

/** UC 12 — đăng ký Giảng viên: chờ Admin duyệt / xác thực email trường */
export interface RegisterLecturerRequest {
  fullName: string
  email: string
  password: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  otp: string // mã OTP từ email, hiệu lực 15 phút (UC 2)
  newPassword: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

/** UC 19 — Admin login bước 2: xác thực OTP (2FA) */
export interface VerifyOtpRequest {
  email: string
  otp: string
}
