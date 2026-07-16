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
              documentName: 'AI cơ bản.pdf',
              page: 3,
              snippet: 'RAG giúp kết hợp nguồn tri thức ngoại vi với phản hồi người dùng.',
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

export const mockPipelineSummary = [
  { department: 'AI', queued: 2, indexing: 1, ready: 5, failed: 0 },
  { department: 'NLP', queued: 1, indexing: 0, ready: 3, failed: 0 },
]
