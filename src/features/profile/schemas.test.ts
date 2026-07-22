import { describe, it, expect } from 'vitest'
import { updateProfileSchema } from './schemas'

// UC 5 — cập nhật hồ sơ: Họ tên + Ngày sinh bắt buộc; SĐT rỗng được, hoặc 9–11 chữ số.
describe('updateProfileSchema', () => {
  const valid = { fullName: 'Trần Văn Sỹ', dateOfBirth: '2003-01-15', phone: '0987654321' }

  it('chấp nhận dữ liệu hợp lệ', () => {
    expect(updateProfileSchema.safeParse(valid).success).toBe(true)
  })

  it('chấp nhận số điện thoại rỗng', () => {
    expect(updateProfileSchema.safeParse({ ...valid, phone: '' }).success).toBe(true)
  })

  it('từ chối số điện thoại có chữ hoặc quá ngắn', () => {
    expect(updateProfileSchema.safeParse({ ...valid, phone: 'abc' }).success).toBe(false)
    expect(updateProfileSchema.safeParse({ ...valid, phone: '123' }).success).toBe(false)
  })

  it('từ chối khi thiếu họ tên hoặc ngày sinh', () => {
    expect(updateProfileSchema.safeParse({ ...valid, fullName: '' }).success).toBe(false)
    expect(updateProfileSchema.safeParse({ ...valid, dateOfBirth: '' }).success).toBe(false)
  })
})
