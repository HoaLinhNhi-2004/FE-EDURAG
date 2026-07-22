import { z } from 'zod'

/**
 * Schema validate cho các form auth của luồng Client.
 * Quy tắc rút từ spec (sheet "Chức năng"). Dùng chung cho react-hook-form
 * qua zodResolver và cho việc suy ra type form (z.infer).
 */

// Email: BE KHÔNG enforce domain @student (đã chốt ở B7) — FE chỉ validate email
// hợp lệ chung + trim + tối đa 254 ký tự (giới hạn của BE). Nếu sau này BA quyết
// bắt buộc domain trường thì chốt domain chính xác và enforce server-side trước.
const email = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập email')
  .max(254, 'Email không được vượt quá 254 ký tự')
  .email('Email không đúng định dạng')

const password = z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự')

// UC 1 — Đăng ký sinh viên: MSV và Ngày sinh bắt buộc để định danh.
export const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
    email,
    password,
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    studentCode: z.string().min(1, 'Vui lòng nhập mã số sinh viên'),
    dateOfBirth: z.string().min(1, 'Vui lòng nhập ngày sinh'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

// UC 3 — Đăng nhập: không lộ email tồn tại hay không (xử lý ở tầng thông báo lỗi API).
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  remember: z.boolean().optional(),
})

// UC 2 — Quên mật khẩu: chỉ cần email; không tiết lộ email có tồn tại hay không.
export const forgotPasswordSchema = z.object({
  email,
})

// OTP 6 chữ số — chỉ dùng cho 2FA Admin (UC 19). Luồng quên mật khẩu KHÔNG dùng OTP
// (BE dùng link-token 1 bước — token nằm trong link email, xem resetPasswordSchema).
export const otpSchema = z.object({
  otpCode: z.string().regex(/^\d{6}$/, 'Mã OTP gồm 6 chữ số'),
})

// UC 2 — Đặt mật khẩu mới. Token lấy từ link trong email (query param ?token=), không nằm trong form.
export const resetPasswordSchema = z
  .object({
    newPassword: password,
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

// UC 6 — Đổi mật khẩu: mật khẩu mới phải khác mật khẩu cũ và khớp xác nhận.
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: password,
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
  .refine((d) => d.newPassword !== d.oldPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword'],
  })

// Type form suy ra trực tiếp từ schema — dùng cho useForm<...FormValues>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type LoginFormValues = z.infer<typeof loginSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type OtpFormValues = z.infer<typeof otpSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
