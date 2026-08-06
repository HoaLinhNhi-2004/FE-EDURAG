import { z } from 'zod'
import {
  FULL_NAME_MAX_MESSAGE,
  FUTURE_DATE_MESSAGE,
  MAX_FULL_NAME_LENGTH,
  PHONE_MESSAGE,
  PHONE_PATTERN,
  isFutureDate,
} from '@/utils/validation'

/** UC 5 — cập nhật Họ tên / Ngày sinh / SĐT. MSV & email KHÔNG nằm trong đây (không cho sửa). */
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập họ tên')
    .max(MAX_FULL_NAME_LENGTH, FULL_NAME_MAX_MESSAGE),
  dateOfBirth: z
    .string()
    .min(1, 'Vui lòng nhập ngày sinh')
    .refine((v) => !isFutureDate(v), FUTURE_DATE_MESSAGE),
  phone: z.string().trim().refine((v) => v === '' || PHONE_PATTERN.test(v), PHONE_MESSAGE),
})

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>
