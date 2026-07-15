import { http, HttpResponse, delay } from 'msw'
import type {
  AskRequest,
  AskResponse,
  ChangePasswordRequest,
  ChatMessage,
  ChatSession,
  CourseDocument,
  DocumentVersion,
  LoginRequest,
  LoginResponse,
  Paginated,
  RegisterRequest,
  ResetPasswordRequest,
  SearchRequest,
  SearchResult,
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
  mockAdminUsers,
  mockChatMessages,
  mockChatSessions,
  mockDocumentVersions,
  mockDocuments,
  mockPipelineSummary,
  mockSearchResults,
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

  // POST /api/auth/reset-password — token từ email + mật khẩu mới.
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

  // GET /api/chat/sessions — danh sách phiên chat
  http.get(`${API}/chat/sessions`, async () => {
    await delay(200)
    return ok<Paginated<ChatSession>>({ items: mockChatSessions, total: mockChatSessions.length, offset: 0, limit: mockChatSessions.length })
  }),

  // GET /api/chat/sessions/:id/messages — tin nhắn trong phiên chat
  http.get(new RegExp(`${API}/chat/sessions/(.+)/messages`), async ({ request }) => {
    await delay(200)
    const match = request.url.match(/\/chat\/sessions\/(.+)\/messages$/)
    const sessionId = match?.[1]
    if (!sessionId || !mockChatMessages[sessionId]) {
      return fail(404, 'SESSION_NOT_FOUND', 'Phiên chat không tồn tại.')
    }
    const sessionMessages = mockChatMessages[sessionId]
    return ok<Paginated<ChatMessage>>({ items: sessionMessages, total: sessionMessages.length, offset: 0, limit: sessionMessages.length })
  }),

  // POST /api/chat/ask — gửi câu hỏi và nhận câu trả lời giả lập
  http.post(`${API}/chat/ask`, async ({ request }) => {
    await delay(350)
    const { question, sessionId } = (await request.json()) as AskRequest
    const nextMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Mock trả lời cho: ${question}`,
      createdAt: new Date().toISOString(),
    }
    return ok<AskResponse>({ sessionId: sessionId ?? 'session-1', message: nextMessage })
  }),

  // POST /api/chat/search — tìm kiếm tài liệu trong kho
  http.post(`${API}/chat/search`, async ({ request }) => {
    await delay(200)
    const { query } = (await request.json()) as SearchRequest
    return ok<SearchResult[]>(mockSearchResults.filter((item) => item.snippet.includes(query) || item.documentName.includes(query)))
  }),

  // GET /api/documents — lưới tài liệu giảng viên
  http.get(`${API}/documents`, async () => {
    await delay(200)
    return ok<Paginated<CourseDocument>>({ items: mockDocuments, total: mockDocuments.length, offset: 0, limit: mockDocuments.length })
  }),

  // GET /api/documents/:id/versions — lịch sử version
  http.get(new RegExp(`${API}/documents/(.+)/versions`), async ({ request }) => {
    await delay(200)
    const match = request.url.match(/\/documents\/(.+)\/versions$/)
    const documentId = match?.[1]
    const versions = documentId ? mockDocumentVersions[documentId] : undefined
    if (!documentId || !versions) {
      return fail(404, 'DOCUMENT_NOT_FOUND', 'Tài liệu không tồn tại.')
    }
    return ok<DocumentVersion[]>(versions)
  }),

  // GET /api/admin/users — danh sách người dùng cho dashboard admin
  http.get(`${API}/admin/users`, async () => {
    await delay(200)
    return ok<Paginated<User>>({ items: mockAdminUsers, total: mockAdminUsers.length, offset: 0, limit: mockAdminUsers.length })
  }),

  // GET /api/admin/pipeline — tổng quan pipeline
  http.get(`${API}/admin/pipeline`, async () => {
    await delay(200)
    return ok(mockPipelineSummary)
  }),
]

export const handlers = [...authHandlers, ...chatHandlers]
