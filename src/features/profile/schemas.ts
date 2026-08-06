import { z } from 'zod'

/** UC 5 — cập nhật Họ tên / Ngày sinh / SĐT. MSV & email KHÔNG nằm trong đây (không cho sửa). */
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập họ tên')
    .max(50, 'Họ và tên không được vượt quá 50 ký tự'),
  dateOfBirth: z
    .string()
    .min(1, 'Vui lòng nhập ngày sinh')
    .refine((dob) => {
      if (!dob) return true
      const todayStr = new Date().toISOString().split('T')[0]
      return dob <= todayStr
    }, 'Ngày sinh không được vượt quá ngày hiện tại'),
  phone: z
    .string()
    .refine((v) => v === '' || /^[0-9]{10}$/.test(v), 'Số điện thoại phải gồm đúng 10 chữ số'),
})

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>
