import { FileTextIcon } from '@/components/ui'
import type { Citation } from '@/types'

/**
 * Thẻ trích dẫn nguồn (tên tài liệu + số trang) dưới câu trả lời (UC 7).
 * Click → mở PDF gốc ở panel bên phải (UC 10). title cho xem đoạn trích khi hover.
 */
export function CitationChip({
  citation,
  onSelect,
}: {
  citation: Citation
  onSelect: (citation: Citation) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(citation)}
      title={citation.sourceText}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
    >
      <FileTextIcon width={14} height={14} className="text-indigo-500" />
      <span className="font-medium text-slate-700">{citation.documentTitle}</span>
      {citation.pageNumber != null && (
        <span className="text-slate-400">· trang {citation.pageNumber}</span>
      )}
    </button>
  )
}
