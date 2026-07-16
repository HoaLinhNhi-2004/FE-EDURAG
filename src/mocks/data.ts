import type { ChatMessage, ChatSession, CourseDocument, DocumentVersion, SearchResult, User } from '@/types'

/**
 * Kho tài khoản giả lập cho MSW. Mật khẩu để riêng, không nằm trong User trả về.
 * Khớp contract: role IN HOA (STUDENT/TEACHER/ADMIN), id kiểu số, status enum.
 */
export interface MockAccount {
  user: User
  password: string
}

// Tài khoản mẫu để đăng nhập thử — mật khẩu chung: 12345678
export const mockAccounts: MockAccount[] = [
  {
    password: '12345678',
    user: {
      id: 1,
      fullName: 'Nguyễn Văn A',
      email: '20A1234@student.edu.vn',
      role: 'STUDENT',
      status: 'ACTIVE',
      authVersion: 1,
      studentCode: '20A1234',
      dateOfBirth: '2003-05-12',
      phone: '0900000000',
    },
  },
  {
    password: '12345678',
    user: {
      id: 2,
      fullName: 'Trần Thị B',
      email: 'gv.b@school.edu.vn',
      role: 'TEACHER',
      status: 'ACTIVE',
      authVersion: 1,
      academicTitle: 'Giảng viên',
      degree: 'Thạc sĩ',
      department: 'Công nghệ thông tin',
    },
  },
  {
    password: '12345678',
    user: {
      id: 3,
      fullName: 'Quản trị viên',
      email: 'admin@school.edu.vn',
      role: 'ADMIN',
      status: 'ACTIVE',
      authVersion: 1,
    },
  },
]

// OTP cố định cho 2FA Admin (UC 19) và token reset cố định cho luồng đặt lại mật khẩu (UC 2).
export const MOCK_OTP = '123456'
export const MOCK_RESET_TOKEN = 'reset-token'

let nextId = 100

export const genId = () => nextId++

export const tokenFor = (userId: number) => `mock.access.${userId}`

export const findAccountByEmail = (email: string) =>
  mockAccounts.find((a) => a.user.email.toLowerCase() === email.toLowerCase())

export const findAccountByToken = (token: string | null) => {
  if (!token?.startsWith('mock.access.')) return undefined
  const id = Number(token.replace('mock.access.', ''))
  return mockAccounts.find((a) => a.user.id === id)
}

export const mockChatSessions: ChatSession[] = [
  {
    id: 1,
    title: 'Hỏi về đề cương môn AI',
    createdAt: '2026-07-10T09:00:00.000Z',
    updatedAt: '2026-07-10T09:30:00.000Z',
  },
  {
    id: 2,
    title: 'Tổng hợp tài liệu RAG',
    createdAt: '2026-07-11T14:00:00.000Z',
    updatedAt: '2026-07-11T14:20:00.000Z',
  },
]

export const mockChatMessages: Record<string, ChatMessage[]> = {
  '1': [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Môn AI cần chuẩn bị những nội dung gì?',
      createdAt: '2026-07-10T09:29:00.000Z',
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'Bạn nên chuẩn bị các khái niệm về ML, mạng nơ-ron và ứng dụng RAG trong giáo dục.',
      citations: [
        {
          id: 1,
          documentId: 1,
          documentName: 'AI cơ bản.pdf',
          page: 3,
          snippet: 'RAG giúp kết hợp nguồn tri thức ngoại vi với phản hồi người dùng.',
        },
      ],
      createdAt: '2026-07-10T09:30:00.000Z',
    },
  ],
  '2': [
    {
      id: 'msg-3',
      role: 'user',
      content: 'Cho tôi ví dụ về cách dùng RAG để trả lời câu hỏi học tập.',
      createdAt: '2026-07-11T14:18:00.000Z',
    },
    {
      id: 'msg-4',
      role: 'assistant',
      content: 'Bạn có thể dùng vector search trên tài liệu bài giảng và trả về citation rõ ràng.',
      createdAt: '2026-07-11T14:20:00.000Z',
    },
  ],
}

export const mockSearchResults: SearchResult[] = [
  {
    documentId: 1,
    documentName: 'AI cơ bản.pdf',
    page: 3,
    snippet: 'RAG giúp kết hợp nguồn tri thức ngoại vi với phản hồi người dùng.',
    score: 0.98,
  },
  {
    documentId: 2,
    documentName: 'Xử lý ngôn ngữ tự nhiên.pdf',
    page: 5,
    snippet: 'Các hệ thống RAG sử dụng embedding và truy vấn văn bản hiệu quả.',
    score: 0.87,
  },
]

export const mockDocuments: CourseDocument[] = [
  {
    id: 1,
    name: 'AI cơ bản.pdf',
    fileType: 'pdf',
    courseId: 'CS101',
    courseName: 'Trí tuệ nhân tạo',
    sizeBytes: 1_024_000,
    status: 'ready',
    hidden: false,
    uploadedBy: 'Nguyễn Văn A',
    uploadedAt: '2026-07-01T10:00:00.000Z',
    currentVersion: 3,
  },
  {
    id: 2,
    name: 'Tài liệu RAG.pdf',
    fileType: 'pdf',
    courseId: 'CS102',
    courseName: 'Hệ thống thông minh',
    sizeBytes: 760_000,
    status: 'indexing',
    hidden: false,
    uploadedBy: 'Trần Thị B',
    uploadedAt: '2026-07-05T11:10:00.000Z',
    currentVersion: 1,
  },
]

// Key = id tài liệu dạng chuỗi (khớp param lấy từ URL).
export const mockDocumentVersions: Record<string, DocumentVersion[]> = {
  '1': [
    { version: 1, uploadedAt: '2026-06-10T08:00:00.000Z', uploadedBy: 'Nguyễn Văn A' },
    { version: 2, uploadedAt: '2026-06-20T08:00:00.000Z', uploadedBy: 'Nguyễn Văn A' },
    { version: 3, uploadedAt: '2026-07-01T10:00:00.000Z', uploadedBy: 'Nguyễn Văn A' },
  ],
  '2': [
    { version: 1, uploadedAt: '2026-07-05T11:10:00.000Z', uploadedBy: 'Trần Thị B' },
  ],
}

export const mockAdminUsers: User[] = [
  mockAccounts[0].user,
  mockAccounts[1].user,
  {
    id: 4,
    fullName: 'Phạm Văn C',
    email: 'sv1234@student.edu.vn',
    role: 'STUDENT',
    status: 'ACTIVE',
    authVersion: 1,
    studentCode: 'SV1234',
    dateOfBirth: '2004-02-20',
    phone: '0911222333',
  },
]

export const mockPipelineSummary = [
  { department: 'AI', queued: 2, indexing: 1, ready: 5, failed: 0 },
  { department: 'NLP', queued: 1, indexing: 0, ready: 3, failed: 0 },
]
