import type { Role, User, UserStatus } from '@/types'

/**
 * Payload người dùng thô từ BE.
 *
 * BE trả snake_case ở một số endpoint (`/profile`, `/admin/users`) nên mọi field
 * từ 2 từ trở lên phải nhận được cả hai dạng. Kiểu này là chi tiết của lớp `api/`;
 * code màn hình luôn làm việc với `User` đã chuẩn hóa, không dùng trực tiếp.
 */
export interface RawUser {
  id: number
  email: string
  role: Role
  status: UserStatus
  fullName?: string | null
  full_name?: string | null
  authVersion?: number | null
  auth_version?: number | null
  phone?: string | null
  studentCode?: string | null
  student_code?: string | null
  dateOfBirth?: string | null
  date_of_birth?: string | null
  academicTitle?: string | null
  academic_title?: string | null
  degree?: string | null
  department?: string | null
  assignedCourses?: string[] | null
  assigned_courses?: string[] | null
  joinDate?: string | null
  createdAt?: string | null
  created_at?: string | null
  documentCount?: number | null
  document_count?: number | null
}

/**
 * Chuẩn hóa payload người dùng của BE về `User` camelCase của FE.
 *
 * Trả `null` khi BE không kèm dữ liệu người dùng — nơi gọi tự quyết định xử lý
 * (ví dụ store auth sẽ gọi lại `/profile` để lấy hồ sơ đầy đủ).
 */
export function mapBackendUser(raw: RawUser | null | undefined): User | null {
  if (!raw) return null
  return {
    id: raw.id,
    fullName: raw.fullName ?? raw.full_name ?? '',
    email: raw.email,
    role: raw.role,
    status: raw.status,
    authVersion: raw.authVersion ?? raw.auth_version ?? 0,
    phone: raw.phone,
    studentCode: raw.studentCode ?? raw.student_code ?? undefined,
    dateOfBirth: raw.dateOfBirth ?? raw.date_of_birth ?? undefined,
    academicTitle: raw.academicTitle ?? raw.academic_title,
    degree: raw.degree,
    department: raw.department,
    assignedCourses: raw.assignedCourses ?? raw.assigned_courses ?? undefined,
    // BE đặt tên ngày tạo tài khoản là createdAt/created_at tùy endpoint.
    joinDate: raw.joinDate ?? raw.createdAt ?? raw.created_at ?? undefined,
    documentCount: raw.documentCount ?? raw.document_count ?? undefined,
  }
}
