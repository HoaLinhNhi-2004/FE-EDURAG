const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

/**
 * Ngày hôm nay theo múi giờ máy người dùng, định dạng 'YYYY-MM-DD'.
 * Dùng cho thuộc tính `max` của <input type="date"> và cho việc chặn ngày tương lai.
 */
export function todayISODate(): string {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/**
 * Nhãn thời gian cho danh sách lịch sử chat (UC 9):
 * hôm nay → "Hôm nay, 14:30" · hôm qua → "Hôm qua, 09:15" · cũ hơn → "02/07/2026".
 */
export function formatSessionTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  if (isSameDay(date, now)) return `Hôm nay, ${time}`

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(date, yesterday)) return `Hôm qua, ${time}`

  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
