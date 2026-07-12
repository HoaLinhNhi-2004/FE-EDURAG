import type { User } from '@/types'

/**
 * Kho tài khoản giả lập cho MSW. Mật khẩu để riêng, không nằm trong User trả về.
 * Dùng để test luồng auth khi chưa có BE (task 3.3).
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
      id: 'sv-001',
      fullName: 'Nguyễn Văn A',
      email: '20A1234@student.edu.vn',
      role: 'student',
      studentCode: '20A1234',
      dateOfBirth: '2003-05-12',
      phone: '0900000000',
      status: 'active',
    },
  },
  {
    password: '12345678',
    user: {
      id: 'gv-001',
      fullName: 'Trần Thị B',
      email: 'gv.b@school.edu.vn',
      role: 'lecturer',
      academicTitle: 'Thạc sĩ',
      department: 'Công nghệ thông tin',
      status: 'active',
    },
  },
  {
    password: '12345678',
    user: {
      id: 'ad-001',
      fullName: 'Quản trị viên',
      email: 'admin@school.edu.vn',
      role: 'admin',
      status: 'active',
    },
  },
]

// OTP cố định cho luồng đặt lại mật khẩu (UC 2) và 2FA của Admin (UC 19)
export const MOCK_OTP = '123456'

export const tokenFor = (userId: string) => `mock.access.${userId}`

export const findAccountByEmail = (email: string) =>
  mockAccounts.find((a) => a.user.email.toLowerCase() === email.toLowerCase())

export const findAccountByToken = (token: string | null) => {
  if (!token?.startsWith('mock.access.')) return undefined
  const id = token.replace('mock.access.', '')
  return mockAccounts.find((a) => a.user.id === id)
}
