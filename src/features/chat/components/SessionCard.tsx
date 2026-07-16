import { ChatBubbleIcon, ClockIcon, TrashIcon } from '@/components/ui'
import type { ChatSession } from '@/types'
import { formatSessionTime } from '@/utils/datetime'

/**
 * Một phiên trong danh sách Lịch sử (UC 9): tiêu đề, đoạn xem trước, thời gian, số tin nhắn.
 * Click card → mở lại phiên để chat tiếp. Nút xóa hiện khi hover (thiết kế không có nút xóa
 * cố định trên card, nên để hover cho khỏi phá bố cục).
 */
export function SessionCard({
  session,
  onOpen,
  onDelete,
}: {
  session: ChatSession
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <div className="group relative rounded-xl border border-slate-100 bg-slate-50 transition-colors hover:bg-white hover:shadow-sm">
      <button type="button" onClick={onOpen} className="flex w-full gap-3 p-4 text-left">
        <ChatBubbleIcon width={18} height={18} className="mt-0.5 shrink-0 text-indigo-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800">{session.title}</p>
          {session.preview && (
            <p className="mt-0.5 truncate text-sm text-slate-500">{session.preview}</p>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <ClockIcon width={13} height={13} />
              {formatSessionTime(session.updatedAt)}
            </span>
            <span>{session.messageCount ?? 0} tin nhắn</span>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onDelete}
        title="Xóa phiên chat này"
        className="absolute right-3 top-3 hidden rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 group-hover:block"
      >
        <TrashIcon width={16} height={16} />
      </button>
    </div>
  )
}
