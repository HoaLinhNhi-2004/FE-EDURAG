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
  const displayTitle = session.title || 'Cuộc trò chuyện mới'

  return (
    <div className="group relative rounded-xl border border-slate-100 bg-white transition-all hover:shadow-sm hover:border-indigo-100">
      <button type="button" onClick={onOpen} className="flex w-full gap-3 p-4 text-left">
        {/* Icon */}
        <div className="relative mt-0.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
            <ChatBubbleIcon width={18} height={18} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {/* Title — nổi bật */}
          <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
            {displayTitle}
          </p>
          {/* Metadata row */}
          <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <ClockIcon width={12} height={12} />
              {formatSessionTime(session.lastMessageAt ?? session.updatedAt)}
            </span>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onDelete}
        title="Xóa phiên chat này"
        className="absolute right-3 top-3 hidden rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 group-hover:block transition-colors"
      >
        <TrashIcon width={16} height={16} />
      </button>
    </div>
  )
}

