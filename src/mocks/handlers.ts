import { http, HttpResponse, delay } from 'msw'
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  User,
  VerifyOtpRequest,
} from '@/types'
import {
  MOCK_OTP,
  MOCK_RESET_TOKEN,
  findAccountByEmail,
  findAccountByToken,
  genId,
  mockAccounts,
  tokenFor,
} from './data'
import { chatHandlers } from './chat.handlers'

const API = import.meta.env.VITE_API_BASE_URL

const ok = <T>(data: T, status = 200) =>
  HttpResponse.json({ success: true, message: 'OK', data }, { status })
const fail = (status: number, errorCode: string, message: string) =>
  HttpResponse.json({ success: false, message, errorCode }, { status })

const bearer = (request: Request) =>
  request.headers.get('Authorization')?.replace('Bearer ', '') ?? null

export const authHandlers = [
  // POST /api/auth/register — gộp Student & Teacher. STUDENT→ACTIVE, TEACHER→PENDING (không trả JWT).
  http.post(`${API}/auth/register`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as RegisterRequest
    if (findAccountByEmail(body.email)) {
      return fail(409, 'EMAIL_EXISTS', 'Email đã được đăng ký.')
    }
    const user: User = {
      id: genId(),
      fullName: body.fullName,
      email: body.email,
      role: body.role,
      status: body.role === 'STUDENT' ? 'ACTIVE' : 'PENDING',
      authVersion: 1,
      phone: body.phone ?? null,
      studentCode: body.studentCode,
      dateOfBirth: body.dateOfBirth,
      academicTitle: body.academicTitle ?? null,
      degree: body.degree ?? null,
      department: body.department ?? null,
    }
    mockAccounts.push({ user, password: body.password })
    return ok({ id: user.id }, 201)
  }),

  // POST /api/auth/login — STUDENT/TEACHER (ACTIVE) → JWT; ADMIN → yêu cầu OTP.
  http.post(`${API}/auth/login`, async ({ request }) => {
    await delay(300)
    const { email, password } = (await request.json()) as LoginRequest
    const account = findAccountByEmail(email)
    if (!account || account.password !== password) {
      return fail(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.')
    }
    if (account.user.status !== 'ACTIVE') {
      return fail(403, 'ACCOUNT_NOT_ACTIVE', 'Tài khoản chưa được kích hoạt hoặc đã bị khóa.')
    }
    if (account.user.role === 'ADMIN') {
      return ok({ requireOtp: true })
    }
    return ok<LoginResponse>({ token: tokenFor(account.user.id), user: account.user })
  }),

  // POST /api/auth/admin/verify-otp — 2FA Admin.
  http.post(`${API}/auth/admin/verify-otp`, async ({ request }) => {
    await delay(300)
    const { email, otpCode } = (await request.json()) as VerifyOtpRequest
    const account = findAccountByEmail(email)
    if (!account || account.user.role !== 'ADMIN' || otpCode !== MOCK_OTP) {
      return fail(400, 'OTP_INVALID', 'Mã OTP không đúng hoặc đã hết hạn.')
    }
    return ok<LoginResponse>({ token: tokenFor(account.user.id), user: account.user })
  }),

  http.post(`${API}/auth/logout`, async () => ok(null)),

  // POST /api/auth/forgot-password — LUÔN trả thành công (chống dò tài khoản).
  http.post(`${API}/auth/forgot-password`, async () => {
    await delay(300)
    return ok(null)
  }),

  // POST /api/auth/verify-reset-otp — bước 1 của reset: xác thực OTP, đổi lấy resetToken.
  // GIẢ ĐỊNH endpoint (chưa có trong OpenAPI) — chờ BE xác nhận.
  http.post(`${API}/auth/verify-reset-otp`, async ({ request }) => {
    await delay(300)
    const { otpCode } = (await request.json()) as { email: string; otpCode: string }
    if (otpCode !== MOCK_OTP) {
      return fail(400, 'OTP_INVALID', 'Mã OTP không đúng hoặc đã hết hạn.')
    }
    return ok({ resetToken: MOCK_RESET_TOKEN })
  }),

  // POST /api/auth/reset-password — bước 2: resetToken + mật khẩu mới.
  http.post(`${API}/auth/reset-password`, async ({ request }) => {
    await delay(300)
    const { token } = (await request.json()) as ResetPasswordRequest
    if (token !== MOCK_RESET_TOKEN) {
      return fail(400, 'TOKEN_INVALID', 'Liên kết đặt lại không hợp lệ hoặc đã hết hạn.')
    }
    return ok(null)
  }),

  // GET /api/profile — thông tin người dùng hiện tại (khôi phục session).
  http.get(`${API}/profile`, async ({ request }) => {
    const account = findAccountByToken(bearer(request))
    if (!account) {
      return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ.')
    }
    return ok<User>(account.user)
  }),

  // PUT /api/profile — cập nhật hồ sơ (MSV & email không cho sửa).
  http.put(`${API}/profile`, async ({ request }) => {
    await delay(300)
    const account = findAccountByToken(bearer(request))
    if (!account) {
      return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ.')
    }
    const body = (await request.json()) as UpdateProfileRequest
    account.user = { ...account.user, ...body }
    return ok<User>(account.user)
  }),

  // PUT /api/profile/password — đổi mật khẩu (UC 6).
  http.put(`${API}/profile/password`, async ({ request }) => {
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

export const handlers = [...authHandlers, ...chatHandlers]
