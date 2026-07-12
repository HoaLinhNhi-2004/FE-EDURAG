import { http, HttpResponse, delay } from 'msw'
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterLecturerRequest,
  RegisterStudentRequest,
  ResetPasswordRequest,
  User,
  VerifyOtpRequest,
} from '@/types'
import {
  MOCK_OTP,
  findAccountByEmail,
  findAccountByToken,
  mockAccounts,
  tokenFor,
} from './data'

const API = import.meta.env.VITE_API_BASE_URL

const ok = <T>(data: T) => HttpResponse.json({ success: true, data })
const fail = (status: number, code: string, message: string) =>
  HttpResponse.json({ success: false, code, message }, { status })

const bearer = (request: Request) =>
  request.headers.get('Authorization')?.replace('Bearer ', '') ?? null

export const authHandlers = [
  // UC 3 — Đăng nhập. Sai thông tin trả lỗi CHUNG, không lộ email có tồn tại hay không.
  http.post(`${API}/auth/login`, async ({ request }) => {
    await delay(300)
    const { email, password } = (await request.json()) as LoginRequest
    const account = findAccountByEmail(email)
    if (!account || account.password !== password) {
      return fail(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.')
    }
    if (account.user.status === 'pending') {
      return fail(403, 'ACCOUNT_PENDING', 'Tài khoản đang chờ duyệt.')
    }
    if (account.user.status === 'locked') {
      return fail(403, 'ACCOUNT_LOCKED', 'Tài khoản đã bị khóa.')
    }
    return ok<LoginResponse>({ accessToken: tokenFor(account.user.id), user: account.user })
  }),

  // UC 1 — Đăng ký sinh viên: email trùng → báo lỗi, không tạo trùng; thành công → tự đăng nhập.
  http.post(`${API}/auth/register/student`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as RegisterStudentRequest
    if (findAccountByEmail(body.email)) {
      return fail(409, 'EMAIL_EXISTS', 'Email đã được đăng ký.')
    }
    const user: User = {
      id: `sv-${Date.now()}`,
      fullName: body.fullName,
      email: body.email,
      role: 'student',
      studentCode: body.studentCode,
      dateOfBirth: body.dateOfBirth,
      status: 'active',
    }
    mockAccounts.push({ user, password: body.password })
    return ok<LoginResponse>({ accessToken: tokenFor(user.id), user })
  }),

  // UC 12 — Đăng ký giảng viên: tạo ở trạng thái chờ duyệt.
  http.post(`${API}/auth/register/lecturer`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as RegisterLecturerRequest
    if (findAccountByEmail(body.email)) {
      return fail(409, 'EMAIL_EXISTS', 'Email đã được đăng ký.')
    }
    const user: User = {
      id: `gv-${Date.now()}`,
      fullName: body.fullName,
      email: body.email,
      role: 'lecturer',
      status: 'pending',
    }
    mockAccounts.push({ user, password: body.password })
    return ok<{ status: 'pending' }>({ status: 'pending' })
  }),

  // UC 2 — Quên mật khẩu: LUÔN trả thành công dù email có tồn tại hay không (chống dò tài khoản).
  http.post(`${API}/auth/forgot-password`, async () => {
    await delay(300)
    return ok(null)
  }),

  // UC 2 — Đặt lại mật khẩu bằng OTP (mock chấp nhận OTP cố định).
  http.post(`${API}/auth/reset-password`, async ({ request }) => {
    await delay(300)
    const { otp } = (await request.json()) as ResetPasswordRequest
    if (otp !== MOCK_OTP) {
      return fail(400, 'OTP_INVALID', 'Mã OTP không đúng hoặc đã hết hạn.')
    }
    return ok(null)
  }),

  // UC 19 — Admin 2FA: xác thực OTP sau bước email/mật khẩu.
  http.post(`${API}/auth/verify-otp`, async ({ request }) => {
    await delay(300)
    const { email, otp } = (await request.json()) as VerifyOtpRequest
    const account = findAccountByEmail(email)
    if (!account || account.user.role !== 'admin' || otp !== MOCK_OTP) {
      return fail(401, 'OTP_INVALID', 'Mã OTP không đúng hoặc đã hết hạn.')
    }
    return ok<LoginResponse>({ accessToken: tokenFor(account.user.id), user: account.user })
  }),

  // Lấy thông tin người dùng hiện tại theo token (dùng khôi phục session).
  http.get(`${API}/auth/me`, async ({ request }) => {
    const account = findAccountByToken(bearer(request))
    if (!account) {
      return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ.')
    }
    return ok<User>(account.user)
  }),

  // UC 6 — Đổi mật khẩu: mật khẩu mới phải khác cũ; kiểm tra mật khẩu cũ đúng.
  http.post(`${API}/auth/change-password`, async ({ request }) => {
    await delay(300)
    const account = findAccountByToken(bearer(request))
    if (!account) {
      return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ.')
    }
    const { oldPassword, newPassword } = (await request.json()) as ChangePasswordRequest
    if (account.password !== oldPassword) {
      return fail(400, 'WRONG_PASSWORD', 'Mật khẩu hiện tại không đúng.')
    }
    if (oldPassword === newPassword) {
      return fail(400, 'SAME_PASSWORD', 'Mật khẩu mới phải khác mật khẩu hiện tại.')
    }
    account.password = newPassword
    return ok(null)
  }),
]

export const handlers = [...authHandlers]
