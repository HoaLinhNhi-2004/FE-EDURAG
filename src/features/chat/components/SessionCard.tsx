import { ChatBubbleIcon, ClockIcon, TrashIcon } from '@/components/ui'
import type { ChatSession } from '@/types'
import { formatSessionTime } from '@/utils/datetime'

/**
 * Một phiên trong danh sách Lịch sử (UC 9): tiêu đề + thời điểm tin nhắn cuối.
 * BE không trả `preview`/`messageCount` (chốt B7) nên chỉ hiển thị `lastMessageAt`.
 * Click card → mở lại phiên để chat tiếp. Nút xóa hiện khi hover.
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
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <ClockIcon width={13} height={13} />
              {formatSessionTime(session.lastMessageAt ?? session.updatedAt)}
            </span>
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
