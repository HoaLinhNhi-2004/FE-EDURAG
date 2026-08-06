import { http, HttpResponse, delay } from 'msw'
import type {
  ChangePasswordRequest,
  CourseDocument,
  DocumentVersion,
  LoginRequest,
  LoginResponse,
  MessagesPage,
  Paginated,
  RegisterRequest,
  ResetPasswordRequest,
  SearchRequest,
  SearchResult,
  SessionsPage,
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
import { chatHandlers, toWireMessage } from './chat.handlers'

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
  // BE gửi email kèm link chứa token; không có bước OTP. Dev: mở /reset?token=<MOCK_RESET_TOKEN>.
  http.post(`${API}/auth/forgot-password`, async () => {
    await delay(300)
    return ok(null)
  }),

  // POST /api/auth/reset-password — luồng 1 bước: token (từ link email) + mật khẩu mới.
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
  // BE trả {offset,limit,total,sessions}; mỗi phiên có lastMessageAt (không preview/messageCount).
  http.get(`${API}/chat/sessions`, async () => {
    await delay(200)
    const sessions = [...mockChatSessions].sort(
      (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    )
    return ok<SessionsPage>({ sessions, total: sessions.length, offset: 0, limit: sessions.length })
  }),

  // GET /api/chat/sessions/:id/messages — BE trả {session, messages, offset, limit, total}.
  http.get(new RegExp(`${API}/chat/sessions/(.+)/messages`), async ({ request }) => {
    await delay(200)
    const match = request.url.match(/\/chat\/sessions\/(.+)\/messages$/)
    const sessionId = match?.[1]
    const session = mockChatSessions.find((s) => String(s.id) === sessionId)
    if (!sessionId || !mockChatMessages[sessionId] || !session) {
      return fail(404, 'SESSION_NOT_FOUND', 'Phiên chat không tồn tại.')
    }
    const messages = mockChatMessages[sessionId].map((m, i) =>
      toWireMessage(m, Number(sessionId), i),
    )
    return ok<MessagesPage>({
      session,
      messages,
      offset: 0,
      limit: messages.length,
      total: messages.length,
    })
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

  // GET /api/library/documents — thư viện công khai (READY + VISIBLE + chưa xóa).
  // Params: q (OR title/description/author), fileType AND, sort (newest|oldest|title_asc|title_desc), page+limit.
  // search là alias legacy của q. offset là exact legacy offset cho page.
  // %, _, \ trong q/author là ký tự literal (không phải SQL wildcard).
  http.get(`${API}/library/documents`, async ({ request }) => {
    await delay(200)
    const url = new URL(request.url)
    const P = url.searchParams

    // ── Legacy alias: search = q (accepted khi giống nhau sau trim) ──
    const qRaw = P.get('q') ?? ''
    const searchRaw = P.get('search') ?? ''
    const qTrimmed = qRaw.trim()
    const searchTrimmed = searchRaw.trim()
    if (qTrimmed && searchTrimmed && qTrimmed !== searchTrimmed) {
      return HttpResponse.json(
        { success: false, message: 'Conflicting q and search params.', errorCode: 'PARAM_CONFLICT' },
        { status: 400 },
      )
    }
    const q = qTrimmed || searchTrimmed

    // ── fileType AND filter ──
    const fileTypeParam = (P.get('fileType') ?? '').toLowerCase()

    // ── Pagination: page+limit (default 1, 12); legacy offset alias ──
    const pageNum = Math.max(1, Number(P.get('page') ?? 1))
    const limit = Math.max(1, Math.min(100, Number(P.get('limit') ?? 12)))
    const offsetParam = P.get('offset')
    if (offsetParam !== null) {
      const expectedOffset = (pageNum - 1) * limit
      if (Number(offsetParam) !== expectedOffset) {
        return HttpResponse.json(
          { success: false, message: `offset=${offsetParam} conflicts with page=${pageNum} and limit=${limit}.`, errorCode: 'PARAM_CONFLICT' },
          { status: 400 },
        )
      }
    }

    // ── Sort ──
    type SortKey = 'newest' | 'oldest' | 'title_asc' | 'title_desc'
    const sort = (P.get('sort') ?? 'newest') as SortKey

    // ── Full library dataset (READY + VISIBLE) ──
    const allDocs: CourseDocument[] = [
      ...mockDocuments.filter(d => !d.hidden && d.status === 'ready'),
      {
        id: 101, name: 'Nhập môn học máy.pdf', fileType: 'pdf',
        courseId: 'ML101', courseName: 'Học Máy & AI',
        sizeBytes: 2_400_000, status: 'ready', hidden: false,
        uploadedBy: 'Nguyễn Thị Phượng',
        uploadedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
        currentVersion: 2,
        title: 'Nhập môn học máy – Lý thuyết & Thực hành',
        author: 'Nguyễn Thị Phượng', docType: 'Giáo trình', publishYear: 2024,
        abstract: 'Giáo trình cơ bản về học máy, bao gồm hồi quy, phân loại, clustering và mạng nơ-ron.',
      },
      {
        id: 102, name: 'Slide Deep Learning.txt', fileType: 'txt',
        courseId: 'DL201', courseName: 'Deep Learning',
        sizeBytes: 8_200_000, status: 'ready', hidden: false,
        uploadedBy: 'Trần Quốc Hùng',
        uploadedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
        currentVersion: 1,
        title: 'Kiến trúc mạng nơ-ron sâu',
        author: 'Trần Quốc Hùng', docType: 'Bài giảng / Slide', publishYear: 2025,
        abstract: 'Slide bài giảng về CNN, RNN, Transformer và các kiến trúc deep learning hiện đại.',
      },
      {
        id: 103, name: 'NLP Fundamentals.pdf', fileType: 'pdf',
        courseId: 'NLP301', courseName: 'NLP',
        sizeBytes: 3_100_000, status: 'ready', hidden: false,
        uploadedBy: 'Võ Thị Lan',
        uploadedAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
        currentVersion: 1,
        title: 'Xử lý ngôn ngữ tự nhiên – Nền tảng',
        author: 'Võ Thị Lan', docType: 'Giáo trình', publishYear: 2024,
      },
      {
        id: 104, name: 'Bài tập lớn AI.docx', fileType: 'docx',
        courseId: 'CS101', courseName: 'Trí tuệ nhân tạo',
        sizeBytes: 512_000, status: 'ready', hidden: false,
        uploadedBy: 'Nguyễn Thị Phượng',
        uploadedAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
        currentVersion: 1,
        title: 'Đề bài tập lớn môn Trí tuệ nhân tạo',
        author: 'Bộ môn CNTT', docType: 'Đề thi / Đáp án', publishYear: 2025,
      },
      {
        id: 105, name: 'CV Vision Slides.txt', fileType: 'txt',
        courseId: 'CV401', courseName: 'Computer Vision',
        sizeBytes: 5_600_000, status: 'ready', hidden: false,
        uploadedBy: 'Nguyễn Thị Phượng',
        uploadedAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
        currentVersion: 1,
        title: 'Computer Vision – Object Detection & Segmentation',
        author: 'Nguyễn Thị Phượng', docType: 'Bài giảng / Slide', publishYear: 2025,
        abstract: 'Slide về YOLO, Faster R-CNN, Mask R-CNN và semantic segmentation.',
      },
      {
        id: 106, name: 'Data Science Handbook.pdf', fileType: 'pdf',
        courseId: 'DS101', courseName: 'Khoa học Dữ liệu',
        sizeBytes: 4_800_000, status: 'ready', hidden: false,
        uploadedBy: 'Trần Quốc Hùng',
        uploadedAt: new Date(Date.now() - 15 * 86_400_000).toISOString(),
        currentVersion: 3,
        title: 'Khoa học Dữ liệu từ A đến Z',
        author: 'Trần Quốc Hùng', docType: 'Giáo trình', publishYear: 2023,
        abstract: 'Toàn bộ pipeline phân tích dữ liệu: thu thập, làm sạch, mô hình hóa và trực quan hóa.',
      },
    ]

    // ── Server-side filtering ──
    // q: OR match trong title/description(abstract)/author — %, _, \ là literal
    let result = allDocs
    if (q) {
      const lower = q.toLowerCase()
      result = result.filter(d =>
        (d.title ?? d.name ?? '').toLowerCase().includes(lower) ||
        (d.abstract ?? '').toLowerCase().includes(lower) ||
        (d.author ?? '').toLowerCase().includes(lower),
      )
    }

    // fileType: AND filter
    if (fileTypeParam) {
      result = result.filter(d => (d.fileType ?? '').toLowerCase() === fileTypeParam)
    }

    // ── Sort (với id tie-breaker) ──
    result = [...result].sort((a, b) => {
      if (sort === 'newest') {
        const diff = Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt)
        return diff !== 0 ? diff : b.id - a.id // id tie-breaker
      }
      if (sort === 'oldest') {
        const diff = Date.parse(a.uploadedAt) - Date.parse(b.uploadedAt)
        return diff !== 0 ? diff : a.id - b.id
      }
      if (sort === 'title_asc') {
        const diff = (a.title ?? a.name ?? '').localeCompare(b.title ?? b.name ?? '', 'vi')
        return diff !== 0 ? diff : a.id - b.id
      }
      if (sort === 'title_desc') {
        const diff = (b.title ?? b.name ?? '').localeCompare(a.title ?? a.name ?? '', 'vi')
        return diff !== 0 ? diff : b.id - a.id
      }
      return 0
    })

    // ── Pagination ──
    const total = result.length
    const offset = (pageNum - 1) * limit
    const items = result.slice(offset, offset + limit)

    return ok<Paginated<CourseDocument>>({ items, total, offset, limit })
  }),

  // GET /api/library/documents/:id — Chi tiết một tài liệu (allowlist DTO, READY + VISIBLE).
  // Trạng thái khác hoặc id không tồn tại → 404 (không lộ lifecycle nội bộ).
  http.get(new RegExp(`${API}/library/documents/(\\d+)$`), async ({ request }) => {
    await delay(150)
    const match = request.url.match(/\/library\/documents\/(\d+)$/)
    const docId = Number(match?.[1])

    // Tìm trong toàn bộ library dataset
    const allDocs: CourseDocument[] = [
      ...mockDocuments,
      { id: 101, name: 'Nhập môn học máy.pdf', fileType: 'pdf', courseId: 'ML101', courseName: 'Học Máy & AI', sizeBytes: 2_400_000, status: 'ready', hidden: false, uploadedBy: 'Nguyễn Thị Phượng', uploadedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(), currentVersion: 2, title: 'Nhập môn học máy – Lý thuyết & Thực hành', author: 'Nguyễn Thị Phượng', docType: 'Giáo trình', publishYear: 2024 },
      { id: 102, name: 'Slide Deep Learning.txt', fileType: 'txt', courseId: 'DL201', courseName: 'Deep Learning', sizeBytes: 8_200_000, status: 'ready', hidden: false, uploadedBy: 'Trần Quốc Hùng', uploadedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(), currentVersion: 1, title: 'Kiến trúc mạng nơ-ron sâu', author: 'Trần Quốc Hùng', docType: 'Bài giảng / Slide', publishYear: 2025 },
      { id: 103, name: 'NLP Fundamentals.pdf', fileType: 'pdf', courseId: 'NLP301', courseName: 'NLP', sizeBytes: 3_100_000, status: 'ready', hidden: false, uploadedBy: 'Võ Thị Lan', uploadedAt: new Date(Date.now() - 10 * 86_400_000).toISOString(), currentVersion: 1, title: 'Xử lý ngôn ngữ tự nhiên – Nền tảng', author: 'Võ Thị Lan', docType: 'Giáo trình', publishYear: 2024 },
      { id: 104, name: 'Bài tập lớn AI.docx', fileType: 'docx', courseId: 'CS101', courseName: 'Trí tuệ nhân tạo', sizeBytes: 512_000, status: 'ready', hidden: false, uploadedBy: 'Nguyễn Thị Phượng', uploadedAt: new Date(Date.now() - 1 * 86_400_000).toISOString(), currentVersion: 1, title: 'Đề bài tập lớn môn Trí tuệ nhân tạo', author: 'Bộ môn CNTT', docType: 'Đề thi / Đáp án', publishYear: 2025 },
      { id: 105, name: 'CV Vision Slides.txt', fileType: 'txt', courseId: 'CV401', courseName: 'Computer Vision', sizeBytes: 5_600_000, status: 'ready', hidden: false, uploadedBy: 'Nguyễn Thị Phượng', uploadedAt: new Date(Date.now() - 7 * 86_400_000).toISOString(), currentVersion: 1, title: 'Computer Vision – Object Detection & Segmentation', author: 'Nguyễn Thị Phượng', docType: 'Bài giảng / Slide', publishYear: 2025 },
      { id: 106, name: 'Data Science Handbook.pdf', fileType: 'pdf', courseId: 'DS101', courseName: 'Khoa học Dữ liệu', sizeBytes: 4_800_000, status: 'ready', hidden: false, uploadedBy: 'Trần Quốc Hùng', uploadedAt: new Date(Date.now() - 15 * 86_400_000).toISOString(), currentVersion: 3, title: 'Khoa học Dữ liệu từ A đến Z', author: 'Trần Quốc Hùng', docType: 'Giáo trình', publishYear: 2023 },
    ]
    const doc = allDocs.find(d => d.id === docId)
    // 404 cho cả id không tồn tại lẫn không đủ điều kiện (không lộ lifecycle)
    if (!doc || doc.hidden || doc.status !== 'ready') {
      return fail(404, 'DOCUMENT_NOT_FOUND', 'Tài liệu không tồn tại hoặc không khả dụng.')
    }
    return ok<CourseDocument>(doc)
  }),

  // GET /api/library/documents/:id/source — Stream original as attachment.
  // Record không đủ điều kiện → 404. Record hợp lệ nhưng original bị thiếu → 409 ORIGINAL_SOURCE_UNAVAILABLE.
  http.get(new RegExp(`${API}/library/documents/(\\d+)/source$`), async ({ request }) => {
    await delay(200)
    const match = request.url.match(/\/library\/documents\/(\d+)\/source$/)
    const docId = Number(match?.[1])
    const LIBRARY_IDS = new Set([1, 101, 102, 103, 104, 105, 106])
    // 404: id không tồn tại hoặc không đủ điều kiện
    if (!LIBRARY_IDS.has(docId)) {
      return fail(404, 'DOCUMENT_NOT_FOUND', 'Tài liệu không tồn tại hoặc không khả dụng.')
    }
    // 409: record hợp lệ nhưng original bị thiếu (mock: id 104 = DOCX không có file gốc)
    if (docId === 104) {
      return HttpResponse.json(
        { success: false, message: 'File gốc hiện không khả dụng.', errorCode: 'ORIGINAL_SOURCE_UNAVAILABLE' },
        { status: 409 },
      )
    }
    // Stream mock PDF as attachment
    const { MOCK_PDF_BASE64 } = await import('./mockPdf')
    const pdfBytes = Uint8Array.from(atob(MOCK_PDF_BASE64), c => c.charCodeAt(0))
    return new HttpResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="document-${docId}.pdf"`,
      },
    })
  }),

  // GET /api/library/documents/:id/download — Stream canonical download artifact as attachment.
  http.get(new RegExp(`${API}/library/documents/(\\d+)/download$`), async ({ request }) => {
    await delay(200)
    const match = request.url.match(/\/library\/documents\/(\d+)\/download$/)
    const docId = Number(match?.[1])
    const LIBRARY_IDS = new Set([1, 101, 102, 103, 104, 105, 106])
    if (!LIBRARY_IDS.has(docId)) {
      return fail(404, 'DOCUMENT_NOT_FOUND', 'Tài liệu không tồn tại hoặc không khả dụng.')
    }
    if (docId === 104) {
      return HttpResponse.json(
        { success: false, message: 'File tải canonical hiện không khả dụng.', errorCode: 'CANONICAL_DOWNLOAD_UNAVAILABLE' },
        { status: 409 },
      )
    }
    const { MOCK_PDF_BASE64 } = await import('./mockPdf')
    const pdfBytes = Uint8Array.from(atob(MOCK_PDF_BASE64), c => c.charCodeAt(0))
    return new HttpResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="document-${docId}.pdf"`,
      },
    })
  }),

  // GET /api/library/documents/:id/preview — Inline preview.
  // PDF → stream original inline. DOCX → stream generated PDF khi preview READY.
  // Preview thiếu/pending/failed → 409 (không nới scope library).
  http.get(new RegExp(`${API}/library/documents/(\\d+)/preview$`), async ({ request }) => {
    await delay(200)
    const match = request.url.match(/\/library\/documents\/(\d+)\/preview$/)
    const docId = Number(match?.[1])
    const LIBRARY_IDS = new Set([1, 101, 102, 103, 104, 105, 106])
    if (!LIBRARY_IDS.has(docId)) {
      return fail(404, 'DOCUMENT_NOT_FOUND', 'Tài liệu không tồn tại hoặc không khả dụng.')
    }
    // 409: preview pending/failed (mock: PPTX id 102, 105 chưa có preview PDF)
    if (docId === 102 || docId === 105) {
      return HttpResponse.json(
        { success: false, message: 'Preview chưa sẵn sàng hoặc đang xử lý.', errorCode: 'PREVIEW_NOT_READY' },
        { status: 409 },
      )
    }
    // Stream mock PDF inline (Content-Disposition: inline)
    const { MOCK_PDF_BASE64 } = await import('./mockPdf')
    const pdfBytes = Uint8Array.from(atob(MOCK_PDF_BASE64), c => c.charCodeAt(0))
    return new HttpResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="preview-${docId}.pdf"`,
      },
    })
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

export const dashboardAdminHandlers = [
  http.get(`${API}/admin/dashboard/summary`, async ({ request }) => {
    await delay(300)
    const account = findAdminByToken(bearer(request))
    if (!account) return fail(403, 'FORBIDDEN', 'Không có quyền truy cập.')

    return ok({
      range: { from: null, to: null },
      documents: [
        { processing_status: 'READY', visibility_status: 'VISIBLE', total: 12 },
        { processing_status: 'PROCESSING', visibility_status: 'VISIBLE', total: 1 }
      ],
      chat: { sessions: 48, messages: 312, citations: 284 },
      usage: {
        scope: 'LLM_CALLS_ONLY',
        totals: {
          calls: 312,
          promptTokens: 485000,
          completionTokens: 124000,
          totalTokens: 609000
        },
        breakdown: [
          {
            provider: 'google',
            model: 'gemini-1.5-flash',
            status: 'SUCCEEDED',
            currency: 'USD',
            calls: 300,
            totalTokens: 585000,
            estimatedCost: '0.08775000'
          },
          {
            provider: 'google',
            model: 'gemini-1.5-pro',
            status: 'SUCCEEDED',
            currency: 'USD',
            calls: 12,
            totalTokens: 24000,
            estimatedCost: '0.03600000'
          }
        ]
      }
    })
  })
]

export const handlers = [
  ...authHandlers,
  ...chatHandlers,
  ...teacherAdminHandlers,
  ...studentAdminHandlers,
  ...dashboardAdminHandlers
]
