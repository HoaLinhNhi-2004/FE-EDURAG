import type { LibraryDocument } from '@/types'

/** Định dạng kích thước file từ bytes. */
export function fmtFileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

/** Ngày dạng dd/MM/yyyy. */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Tên file tải về = title + đuôi theo fileType (Content-Disposition không đọc được cross-origin). */
export function downloadName(doc: LibraryDocument): string {
  const ext = doc.fileType.toLowerCase()
  return doc.title.toLowerCase().endsWith(`.${ext}`) ? doc.title : `${doc.title}.${ext}`
}

/** Tải blob xuống bằng thẻ <a download> tạm. */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
