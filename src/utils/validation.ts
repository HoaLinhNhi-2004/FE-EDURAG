import { todayISODate } from './datetime'

/**
 * Giới hạn nhập dùng chung cho form Đăng ký (UC 1) và Sửa hồ sơ (UC 5).
 * Gom về một chỗ để hai màn hình không lệch luật nhau.
 */

/** Họ và tên: tối đa 50 ký tự. */
export const MAX_FULL_NAME_LENGTH = 50

/** Mã số sinh viên: tối đa 10 ký tự. */
export const MAX_STUDENT_CODE_LENGTH = 10

/** Số điện thoại: đúng 10 chữ số, không dấu cách/dấu chấm/mã vùng +84. */
export const PHONE_LENGTH = 10
export const PHONE_PATTERN = /^\d{10}$/

export const FULL_NAME_MAX_MESSAGE = `Họ và tên không được vượt quá ${MAX_FULL_NAME_LENGTH} ký tự`
export const STUDENT_CODE_MAX_MESSAGE = `Mã số sinh viên không được vượt quá ${MAX_STUDENT_CODE_LENGTH} ký tự`
export const PHONE_MESSAGE = `Số điện thoại phải gồm đúng ${PHONE_LENGTH} chữ số`
export const FUTURE_DATE_MESSAGE = 'Ngày sinh không được vượt quá ngày hiện tại'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * true nếu chuỗi 'YYYY-MM-DD' nằm sau ngày hôm nay.
 * So sánh dạng chuỗi (cùng định dạng nên đúng thứ tự) để tránh lệch múi giờ khi new Date().
 * Chuỗi rỗng hoặc sai định dạng → false, để rule "bắt buộc nhập" xử lý riêng.
 */
export function isFutureDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false
  return value > todayISODate()
}
