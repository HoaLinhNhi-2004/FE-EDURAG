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
        <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    )
  }

  const isError = message.status === 'FAILED'

  return (
    <div className="flex gap-3">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isError ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600',
        )}
      >
        <SparkleIcon width={18} height={18} />
      </div>
      <div className="max-w-[80%]">
        <div
          className={cn(
            'whitespace-pre-wrap rounded-2xl rounded-tl-sm border px-4 py-2.5 text-sm',
            isError
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-slate-200 bg-white text-slate-700',
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
