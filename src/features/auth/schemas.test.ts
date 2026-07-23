import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './schemas'

// UC 1, 2, 3, 6 — validate form auth luồng Client (đã căn theo B2: email không bắt @student).
describe('registerSchema', () => {
  const valid = {
    fullName: 'Trần Văn Sỹ',
    email: 'sy@gmail.com',
    password: 'matkhau123',
    confirmPassword: 'matkhau123',
    studentCode: 'SV2021001111',
    dateOfBirth: '2003-01-15',
  }

  it('chấp nhận dữ liệu hợp lệ với email KHÔNG phải @student (B2)', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('từ chối email sai định dạng', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'khong-phai-email' }).success).toBe(false)
  })

  it('từ chối mật khẩu dưới 8 ký tự', () => {
    expect(registerSchema.safeParse({ ...valid, password: '123', confirmPassword: '123' }).success).toBe(false)
  })

  it('từ chối khi thiếu MSV hoặc ngày sinh', () => {
    expect(registerSchema.safeParse({ ...valid, studentCode: '' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...valid, dateOfBirth: '' }).success).toBe(false)
  })

  it('từ chối khi xác nhận mật khẩu không khớp', () => {
    expect(registerSchema.safeParse({ ...valid, confirmPassword: 'khac' }).success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('chấp nhận email + mật khẩu hợp lệ', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true)
  })
  it('từ chối khi thiếu mật khẩu', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('chấp nhận khi khớp và đủ độ dài', () => {
    expect(resetPasswordSchema.safeParse({ newPassword: 'matkhaumoi', confirmPassword: 'matkhaumoi' }).success).toBe(true)
  })
  it('từ chối khi không khớp', () => {
    expect(resetPasswordSchema.safeParse({ newPassword: 'matkhaumoi', confirmPassword: 'khac' }).success).toBe(false)
  })
})

describe('changePasswordSchema (UC 6)', () => {
  it('chấp nhận khi mới khác cũ và khớp xác nhận', () => {
    expect(
      changePasswordSchema.safeParse({ oldPassword: 'cu12345678', newPassword: 'moi12345678', confirmPassword: 'moi12345678' }).success,
    ).toBe(true)
  })
  it('từ chối khi mật khẩu mới trùng mật khẩu cũ', () => {
    expect(
      changePasswordSchema.safeParse({ oldPassword: 'trung12345', newPassword: 'trung12345', confirmPassword: 'trung12345' }).success,
    ).toBe(false)
  })
})
