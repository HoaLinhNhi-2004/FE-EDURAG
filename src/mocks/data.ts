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
      joinDate: '2023-09-05T08:30:00Z',
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
  {
    password: '12345678',
    user: {
      id: 4,
      fullName: 'Lê Văn D',
      email: 'gv.pending@school.edu.vn',
      role: 'TEACHER',
      status: 'PENDING',
      authVersion: 1,
      academicTitle: 'Thạc sĩ',
      department: 'Toán học',
      joinDate: '2024-03-12T14:15:00Z',
    },
  },
  {
    password: '12345678',
    user: {
      id: 5,
      fullName: 'Lê Văn E',
      email: 'gv.locked@school.edu.vn',
      role: 'TEACHER',
      status: 'LOCKED',
      authVersion: 1,
      department: 'Vật lý',
      joinDate: '2022-11-20T09:00:00Z',
    },
  },
  {
    password: '12345678',
    user: {
      id: 6,
      fullName: 'Nguyễn Thị Phượng',
      email: 'gv.phuong@school.edu.vn',
      role: 'TEACHER',
      status: 'ACTIVE',
      authVersion: 1,
      academicTitle: 'Phó Giáo sư',
      degree: 'Tiến sĩ',
      department: 'Khoa học Máy tính',
      joinDate: '2021-08-15T07:00:00Z',
      assignedCourses: ['CS101', 'ML101'],
    },
  },
  {
    password: '12345678',
    user: {
      id: 7,
      fullName: 'Trần Quốc Hùng',
      email: 'gv.hung@school.edu.vn',
      role: 'TEACHER',
      status: 'ACTIVE',
      authVersion: 1,
      academicTitle: 'Giảng viên chính',
      degree: 'Thạc sĩ',
      department: 'Kỹ thuật phần mềm',
      joinDate: '2022-02-10T08:00:00Z',
      assignedCourses: ['DL201'],
    },
  },
  {
    password: '12345678',
    user: {
      id: 8,
      fullName: 'Phạm Minh Tuấn',
      email: 'gv.tuan@school.edu.vn',
      role: 'TEACHER',
      status: 'PENDING',
      authVersion: 1,
      academicTitle: 'Thạc sĩ',
      degree: 'Thạc sĩ',
      department: 'Hệ thống thông tin',
      joinDate: '2025-01-20T09:00:00Z',
    },
  },
  {
    password: '12345678',
    user: {
      id: 9,
      fullName: 'Võ Thị Lan',
      email: 'gv.lan@school.edu.vn',
      role: 'TEACHER',
      status: 'ACTIVE',
      authVersion: 1,
      academicTitle: 'Giảng viên',
      degree: 'Tiến sĩ',
      department: 'Trí tuệ nhân tạo',
      joinDate: '2023-03-01T08:00:00Z',
      assignedCourses: ['NLP301', 'CS102'],
    },
  },
]

// OTP cố định cho 2FA Admin (UC 19) và token reset cố định cho luồng đặt lại mật khẩu (UC 2).
export const MOCK_OTP = '123456'
export const MOCK_RESET_TOKEN = 'reset-token'

let nextId = 100

export const genId = () => nextId++

// Token bao gồm userId và authVersion để có thể vô hiệu hóa tức thời (khi admin khóa user)
export const tokenFor = (userId: number, authVersion: number) => `mock.access.${userId}.${authVersion}`

export const findAccountByEmail = (email: string) =>
  mockAccounts.find((a) => a.user.email.toLowerCase() === email.toLowerCase())

export const findAccountByToken = (token: string | null) => {
  if (!token?.startsWith('mock.access.')) return undefined
  const parts = token.replace('mock.access.', '').split('.')
  const id = Number(parts[0])
  const version = Number(parts[1])
  const account = mockAccounts.find((a) => a.user.id === id)
  if (!account || account.user.authVersion !== version) return undefined
  if (account.user.status !== 'ACTIVE') return undefined // Nếu bị khóa thì token cũng mất hiệu lực
  return account
}

/**
 * Phiên bản relaxed của findAccountByToken dành riêng cho admin routes.
 * Không validate authVersion — tránh lỗi 403 sau HMR reload khi MSW reset
 * in-memory authVersion về 1 nhưng token trong browser mang version cũ.
 */
export const findAdminByToken = (token: string | null) => {
  if (!token?.startsWith('mock.access.')) return undefined
  const parts = token.replace('mock.access.', '').split('.')
  const id = Number(parts[0])
  const account = mockAccounts.find((a) => a.user.id === id)
  if (!account || account.user.role !== 'ADMIN') return undefined
  if (account.user.status !== 'ACTIVE') return undefined
  return account
}


/**
 * Kho phiên chat DÙNG CHUNG cho cả tạo/gửi (chat.handlers.ts) lẫn lịch sử (UC 9).
 * Nhờ vậy phiên tạo từ màn Chat sẽ xuất hiện luôn trong màn Lịch sử.
 */
let sessionSeq = 100
let messageSeq = 5000
export const genSessionId = () => ++sessionSeq
export const genMessageId = () => ++messageSeq

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

export const mockChatSessions: ChatSession[] = [
  { id: 1, title: 'Mạng nơ-ron và hàm kích hoạt', createdAt: hoursAgo(3), updatedAt: hoursAgo(2) },
  { id: 2, title: 'Thuật toán Gradient Descent', createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  { id: 3, title: 'Overfitting và Regularization', createdAt: daysAgo(14), updatedAt: daysAgo(14) },
  { id: 4, title: 'Convolutional Neural Networks', createdAt: daysAgo(16), updatedAt: daysAgo(16) },
  { id: 5, title: 'Transformer và Attention Mechanism', createdAt: daysAgo(18), updatedAt: daysAgo(18) },
]

// Câu hỏi đầu của mỗi phiên cũng chính là "đoạn xem trước" hiển thị ở màn Lịch sử.
const seedPair = (
  sessionId: number,
  question: string,
  answer: string,
  at: string,
  withCitation = false,
): ChatMessage[] => [
  { id: `s${sessionId}-u`, role: 'user', content: question, createdAt: at },
  {
    id: `s${sessionId}-a`,
    role: 'assistant',
    content: answer,
    createdAt: at,
    ...(withCitation
      ? {
          citations: [
            {
              id: 1,
              documentId: 1,
              documentTitle: 'Bài giảng AI cơ bản.pdf',
              pageNumber: 3,
              sourceText: 'Mạng nơ-ron gồm ba lớp: input, hidden và output.',
            },
          ],
        }
      : {}),
  },
]

// Key = id phiên dạng chuỗi (khớp param lấy từ URL).
export const mockChatMessages: Record<string, ChatMessage[]> = {
  '1': seedPair(
    1,
    'Định nghĩa và phân loại mạng nơ-ron gồm những gì?',
    'Mạng nơ-ron gồm các lớp input/hidden/output; phân loại phổ biến: MLP, CNN, RNN. Hàm kích hoạt thường dùng: ReLU, Sigmoid, Tanh.',
    hoursAgo(2),
    true,
  ),
  '2': seedPair(
    2,
    'Giải thích chi tiết về thuật toán Gradient Descent.',
    'Gradient Descent cập nhật tham số ngược hướng đạo hàm của hàm mất mát, với learning rate quyết định bước nhảy.',
    daysAgo(1),
  ),
  '3': seedPair(
    3,
    'Cách phát hiện và xử lý overfitting?',
    'Phát hiện qua chênh lệch train/validation loss. Xử lý bằng regularization (L1/L2), dropout, early stopping, tăng dữ liệu.',
    daysAgo(14),
  ),
  '4': seedPair(
    4,
    'Kiến trúc CNN và ứng dụng trong xử lý ảnh?',
    'CNN dùng lớp convolution + pooling để trích đặc trưng không gian, ứng dụng trong phân loại và nhận dạng ảnh.',
    daysAgo(16),
  ),
  '5': seedPair(
    5,
    'Self-attention và multi-head attention khác nhau thế nào?',
    'Self-attention tính trọng số giữa các token trong cùng chuỗi; multi-head chạy nhiều self-attention song song để học nhiều kiểu quan hệ.',
    daysAgo(18),
  ),
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

export const mockStudents: User[] = [
  {
    id: 101,
    fullName: 'Nguyễn Văn An',
    email: 'sv2021001234@student.hust.edu.vn',
    role: 'STUDENT',
    status: 'ACTIVE',
    authVersion: 1,
    studentCode: 'SV2021001234',
    dateOfBirth: '2003-01-15',
    phone: '0901000001',
  },
  {
    id: 102,
    fullName: 'Trần Thị Bảo',
    email: 'sv2021001235@student.hust.edu.vn',
    role: 'STUDENT',
    status: 'ACTIVE',
    authVersion: 1,
    studentCode: 'SV2021001235',
    dateOfBirth: '2003-03-22',
    phone: '0901000002',
  },
  {
    id: 103,
    fullName: 'Lê Văn Cần',
    email: 'sv2022002001@student.hust.edu.vn',
    role: 'STUDENT',
    status: 'LOCKED',
    authVersion: 2,
    studentCode: 'SV2022002001',
    dateOfBirth: '2004-06-10',
    phone: '0901000003',
  },
  {
    id: 104,
    fullName: 'Phạm Thị Dung',
    email: 'sv2022002002@student.hust.edu.vn',
    role: 'STUDENT',
    status: 'ACTIVE',
    authVersion: 1,
    studentCode: 'SV2022002002',
    dateOfBirth: '2004-08-05',
    phone: '0901000004',
  },
  {
    id: 105,
    fullName: 'Hoàng Minh Em',
    email: 'sv2023003001@student.hust.edu.vn',
    role: 'STUDENT',
    status: 'ACTIVE',
    authVersion: 1,
    studentCode: 'SV2023003001',
    dateOfBirth: '2005-02-18',
    phone: '0901000005',
  },
  {
    id: 106,
    fullName: 'Vũ Thị Phương',
    email: 'sv2023003002@student.hust.edu.vn',
    role: 'STUDENT',
    status: 'ACTIVE',
    authVersion: 1,
    studentCode: 'SV2023003002',
    dateOfBirth: '2005-05-30',
    phone: '0901000006',
  },
]

export const mockPipelineSummary = [
  { department: 'AI', queued: 2, indexing: 1, ready: 5, failed: 0 },
  { department: 'NLP', queued: 1, indexing: 0, ready: 3, failed: 0 },
]
