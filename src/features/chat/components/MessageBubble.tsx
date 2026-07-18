import { SparkleIcon } from '@/components/ui'
import { cn } from '@/utils/cn'
import type { ChatMessage, Citation } from '@/types'
import { CitationChip } from './CitationChip'

/** Bong bóng tin nhắn: người dùng (phải, nền tím) / trợ lý (trái, kèm trích dẫn). */
export function MessageBubble({
  message,
  onSelectCitation,
}: {
  message: ChatMessage
  onSelectCitation: (citation: Citation) => void
}) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-sm text-white">
          {message.imageUrl && (
            <img
              src={message.imageUrl}
              alt="Ảnh đã gửi"
              className="mb-2 max-h-52 w-full rounded-lg object-cover"
            />
          )}
          {message.content && <div className="whitespace-pre-wrap">{message.content}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <SparkleIcon width={18} height={18} />
      </div>
      <div className="max-w-[80%]">
        <div
          className={cn(
            'whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700',
          )}
        >
          {message.content}
        </div>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.citations.map((c) => (
              <CitationChip key={c.id} citation={c} onSelect={onSelectCitation} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
