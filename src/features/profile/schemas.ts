import { z } from 'zod'

/** UC 5 — cập nhật Họ tên / Ngày sinh / SĐT. MSV & email KHÔNG nằm trong đây (không cho sửa). */
export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  dateOfBirth: z.string().min(1, 'Vui lòng nhập ngày sinh'),
  phone: z
    .string()
    .refine((v) => v === '' || /^[0-9]{9,11}$/.test(v), 'Số điện thoại phải gồm 9–11 chữ số'),
})

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>
