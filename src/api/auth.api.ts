import { apiClient } from './client'
import type {
  ApiResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterLecturerRequest,
  RegisterStudentRequest,
  ResetPasswordRequest,
  User,
  VerifyOtpRequest,
} from '@/types'

// Endpoint path chốt lại với BE ở task 3.1 — hiện chạy trên MSW mock (task 3.3)
export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', body).then((r) => r.data.data),

  registerStudent: (body: RegisterStudentRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/register/student', body).then((r) => r.data.data),

  registerLecturer: (body: RegisterLecturerRequest) =>
    apiClient.post<ApiResponse<{ status: 'pending' }>>('/auth/register/lecturer', body).then((r) => r.data.data),

  forgotPassword: (body: ForgotPasswordRequest) =>
    apiClient.post<ApiResponse<null>>('/auth/forgot-password', body).then((r) => r.data),

  resetPassword: (body: ResetPasswordRequest) =>
    apiClient.post<ApiResponse<null>>('/auth/reset-password', body).then((r) => r.data),

  verifyOtp: (body: VerifyOtpRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/verify-otp', body).then((r) => r.data.data),

  me: () => apiClient.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data),

  changePassword: (body: ChangePasswordRequest) =>
    apiClient.post<ApiResponse<null>>('/auth/change-password', body).then((r) => r.data),
}
