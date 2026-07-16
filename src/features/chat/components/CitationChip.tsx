import { FileTextIcon } from '@/components/ui'
import type { Citation } from '@/types'

/**
 * Thẻ trích dẫn nguồn (tên tài liệu + số trang) hiển thị dưới câu trả lời (UC 7).
 * Chưa click được — mở PDF gốc là UC 10 (task 2.5). title cho xem snippet khi hover.
 */
export function CitationChip({ citation }: { citation: Citation }) {
  return (
    <span
      title={citation.snippet}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
    >
      <FileTextIcon width={14} height={14} className="text-indigo-500" />
      <span className="font-medium text-slate-700">{citation.documentName}</span>
      <span className="text-slate-400">· trang {citation.page}</span>
    </span>
  )
}
