import { http, HttpResponse, delay } from 'msw'
import type {
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
  findAdminByToken,
  genId,
  mockAccounts,
  mockAdminUsers,
  mockChatMessages,
  mockChatSessions,
  mockDocumentVersions,
  mockDocuments,
  mockPipelineSummary,
  mockSearchResults,
  mockStudents,
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
    return ok<LoginResponse>({ token: tokenFor(account.user.id, account.user.authVersion), user: account.user })
  }),

  // POST /api/auth/admin/verify-otp — 2FA Admin.
  http.post(`${API}/auth/admin/verify-otp`, async ({ request }) => {
    await delay(300)
    const { email, otpCode } = (await request.json()) as VerifyOtpRequest
    const account = findAccountByEmail(email)
    if (!account || account.user.role !== 'ADMIN' || otpCode !== MOCK_OTP) {
      return fail(400, 'OTP_INVALID', 'Mã OTP không đúng hoặc đã hết hạn.')
    }
    return ok<LoginResponse>({ token: tokenFor(account.user.id, account.user.authVersion), user: account.user })
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

  // GET /api/chat/sessions — danh sách phiên chat (UC 9), mới nhất trước.
  // preview = câu hỏi đầu phiên, messageCount = số tin nhắn thực tế trong kho.
  http.get(`${API}/chat/sessions`, async () => {
    await delay(200)
    const items: ChatSession[] = [...mockChatSessions]
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .map((s) => {
        const msgs = mockChatMessages[String(s.id)] ?? []
        return { ...s, preview: msgs[0]?.content ?? '', messageCount: msgs.length }
      })
    return ok<Paginated<ChatSession>>({ items, total: items.length, offset: 0, limit: items.length })
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

  // Gửi câu hỏi: dùng POST /api/chat/sessions/{id}/messages (xem chat.handlers.ts).
  // /chat/ask (contract cũ) đã bỏ để thống nhất theo OpenAPI.

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

  // POST /api/documents — upload tài liệu mới (multipart/form-data)
  http.post(`${API}/documents`, async ({ request }) => {
    await delay(800)
    const account = findAccountByToken(bearer(request))
    if (!account) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ.')
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return fail(400, 'MISSING_FILE', 'Chưa chọn file.')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const allowedExt = ['pdf', 'docx', 'pptx']
    if (!allowedExt.includes(ext)) return fail(400, 'INVALID_TYPE', 'Chỉ chấp nhận PDF, DOCX, PPTX.')
    if (file.size > 50 * 1024 * 1024) return fail(400, 'FILE_TOO_LARGE', 'File vượt quá 50 MB.')
    const courseId = (formData.get('courseId') as string) ?? 'UNKNOWN'
    const publishYearRaw = formData.get('publishYear') as string | null
    const newDoc: CourseDocument = {
      id: genId(),
      name: file.name,
      fileType: ext as CourseDocument['fileType'],
      courseId,
      courseName: mockDocuments.find((d) => d.courseId === courseId)?.courseName ?? courseId,
      sizeBytes: file.size,
      status: 'queued',
      hidden: false,
      uploadedBy: account.user.fullName,
      uploadedAt: new Date().toISOString(),
      currentVersion: 1,
      title: (formData.get('title') as string) || undefined,
      author: (formData.get('author') as string) || undefined,
      docType: (formData.get('docType') as string) || undefined,
      publishYear: publishYearRaw ? Number(publishYearRaw) : undefined,
      abstract: (formData.get('abstract') as string) || undefined,
    }
    mockDocuments.push(newDoc)
    return ok<CourseDocument>(newDoc, 201)
  }),

  // PATCH /api/documents/:id/visibility — ẩn/hiện tài liệu
  http.patch(new RegExp(`${API}/documents/(.+)/visibility`), async ({ request }) => {
    await delay(200)
    const account = findAccountByToken(bearer(request))
    if (!account) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ.')
    const match = request.url.match(/\/documents\/(.+)\/visibility$/)
    const docId = Number(match?.[1])
    const doc = mockDocuments.find((d) => d.id === docId)
    if (!doc) return fail(404, 'DOCUMENT_NOT_FOUND', 'Tài liệu không tồn tại.')
    const body = await request.json() as { hidden: boolean }
    doc.hidden = body.hidden
    return ok<CourseDocument>(doc)
  }),

  // DELETE /api/documents/:id — xoá tài liệu
  http.delete(new RegExp(`${API}/documents/([^/]+)$`), async ({ request }) => {
    await delay(300)
    const account = findAccountByToken(bearer(request))
    if (!account) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ.')
    const match = request.url.match(/\/documents\/([^/]+)$/)
    const docId = Number(match?.[1])
    const idx = mockDocuments.findIndex((d) => d.id === docId)
    if (idx === -1) return fail(404, 'DOCUMENT_NOT_FOUND', 'Tài liệu không tồn tại.')
    mockDocuments.splice(idx, 1)
    return ok(null)
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

export const teacherAdminHandlers = [
  // Lấy danh sách giảng viên
  http.get(`${API}/admin/teachers`, async ({ request }) => {
    await delay(300)
    const account = findAdminByToken(bearer(request))
    if (!account) return fail(403, 'FORBIDDEN', 'Không có quyền truy cập.')
    
    const teachers = mockAccounts.map(a => a.user).filter(u => u.role === 'TEACHER')
    const teachersWithDocCount = teachers.map(t => ({
      ...t,
      documentCount: mockDocuments.filter(d => String(d.uploadedBy) === String(t.id)).length
    }))
    return ok({ items: teachersWithDocCount, total: teachersWithDocCount.length, offset: 0, limit: teachersWithDocCount.length })
  }),

  // Cập nhật trạng thái giảng viên (Duyệt/Từ chối/Khóa/Mở khóa)
  http.patch(`${API}/admin/teachers/:id/status`, async ({ request, params }) => {
    await delay(400)
    const account = findAdminByToken(bearer(request))
    if (!account) return fail(403, 'FORBIDDEN', 'Không có quyền truy cập.')
    
    const id = Number(params.id)
    const { status } = (await request.json()) as { status: 'ACTIVE' | 'LOCKED' | 'REJECTED' }
    const target = mockAccounts.find(a => a.user.id === id)
    if (!target) return fail(404, 'NOT_FOUND', 'Không tìm thấy giảng viên.')

    target.user.status = status
    // Khóa -> tăng authVersion để invalid session cũ ngay lập tức
    if (status === 'LOCKED') {
      target.user.authVersion += 1
    }

    return ok(target.user)
  }),

  // Gán môn phụ trách
  http.patch(`${API}/admin/teachers/:id/courses`, async ({ request, params }) => {
    await delay(400)
    const account = findAdminByToken(bearer(request))
    if (!account) return fail(403, 'FORBIDDEN', 'Không có quyền truy cập.')
    
    const id = Number(params.id)
    const { assignedCourses } = (await request.json()) as { assignedCourses: string[] }
    const target = mockAccounts.find(a => a.user.id === id)
    if (!target) return fail(404, 'NOT_FOUND', 'Không tìm thấy giảng viên.')

    target.user.assignedCourses = assignedCourses
    return ok(target.user)
  }),
]

export const studentAdminHandlers = [
  // GET /api/admin/students — danh sách sinh viên
  http.get(`${API}/admin/students`, async ({ request }) => {
    await delay(300)
    const account = findAdminByToken(bearer(request))
    if (!account) return fail(403, 'FORBIDDEN', 'Không có quyền truy cập.')
    return ok({ items: mockStudents, total: mockStudents.length, offset: 0, limit: mockStudents.length })
  }),

  // PATCH /api/admin/students/:id/status — Khóa / Mở khóa
  http.patch(`${API}/admin/students/:id/status`, async ({ request, params }) => {
    await delay(400)
    const account = findAdminByToken(bearer(request))
    if (!account) return fail(403, 'FORBIDDEN', 'Không có quyền truy cập.')
    const id = Number(params.id)
    const { status } = (await request.json()) as { status: 'ACTIVE' | 'LOCKED' }
    const target = mockStudents.find((s) => s.id === id)
    if (!target) return fail(404, 'NOT_FOUND', 'Không tìm thấy sinh viên.')
    target.status = status
    if (status === 'LOCKED') target.authVersion += 1
    return ok(target)
  }),

  // POST /api/admin/students/:id/reset-password — Đặt lại mật khẩu về mặc định
  http.post(`${API}/admin/students/:id/reset-password`, async ({ request, params }) => {
    await delay(400)
    const account = findAdminByToken(bearer(request))
    if (!account) return fail(403, 'FORBIDDEN', 'Không có quyền truy cập.')
    const id = Number(params.id)
    const target = mockStudents.find((s) => s.id === id)
    if (!target) return fail(404, 'NOT_FOUND', 'Không tìm thấy sinh viên.')
    // Reset password in mock accounts if exists
    const acc = mockAccounts.find((a) => a.user.id === id)
    if (acc) acc.password = '12345678'
    return ok({ message: 'Mật khẩu đã được đặt lại về mặc định.' })
  }),
]

export const handlers = [...authHandlers, ...chatHandlers, ...teacherAdminHandlers, ...studentAdminHandlers]
