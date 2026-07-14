import type { User } from '@/types'

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
