import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, PageHeader, PlusIcon, SparkleIcon, Spinner } from '@/components/ui'
import type { Citation } from '@/types'
import { useChat } from '../hooks/useChat'
import { MessageBubble } from '../components/MessageBubble'
import { TypingIndicator } from '../components/TypingIndicator'
import { ChatInput } from '../components/ChatInput'
import { PdfViewerPanel } from '../components/PdfViewerPanel'

/** UC 7 — Khung chat hỏi đáp; UC 10 — click trích dẫn mở PDF ở panel bên phải. */
export function ChatPage() {
  // Mở lại một phiên từ màn Lịch sử: /student?session=<id> (UC 9).
  const [searchParams, setSearchParams] = useSearchParams()
  const sessionParam = Number(searchParams.get('session'))
  const initialSessionId = Number.isFinite(sessionParam) && sessionParam > 0 ? sessionParam : undefined

  const { messages, send, startNewSession, activeSessionId, isSending, isLoadingHistory } =
    useChat(initialSessionId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null)

  // Phiên được tạo ngầm ở lần gửi đầu → ghi ngay vào URL để F5 (hoặc chia sẻ link)
  // vẫn mở đúng hội thoại. `replace` để không chèn thêm một bước trong lịch sử trình duyệt.
  useEffect(() => {
    if (activeSessionId != null && activeSessionId !== initialSessionId) {
      setSearchParams({ session: String(activeSessionId) }, { replace: true })
    }
  }, [activeSessionId, initialSessionId, setSearchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  const empty = messages.length === 0
  // Không có gì để dọn (khung chat mới, chưa hỏi) thì nút "mới" vô nghĩa → khóa lại.
  // Đang chờ trả lời cũng khóa, tránh câu trả lời rơi nhầm vào cuộc trò chuyện mới.
  const canStartNew = !isSending && (initialSessionId != null || !empty)

  const handleNewChat = () => {
    setActiveCitation(null)
    startNewSession()
    // Đang mở phiên cũ → bỏ ?session để URL khớp với khung chat trống.
    if (initialSessionId != null) setSearchParams({}, { replace: true })
  }

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <PageHeader
          title="Cuộc trò chuyện AI"
          subtitle="Hỏi đáp thông minh về tài liệu học tập"
          actions={
            <Button
              variant="secondary"
              onClick={handleNewChat}
              disabled={!canStartNew}
              title="Bắt đầu cuộc trò chuyện mới"
              className="py-1.5 text-xs"
            >
              <PlusIcon width={14} height={14} />
              Cuộc trò chuyện mới
            </Button>
          }
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                <Spinner /> Đang tải hội thoại…
              </div>
            ) : empty ? (
              <div className="mt-16 flex flex-col items-center text-center text-slate-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <SparkleIcon width={28} height={28} />
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-700">Hỏi đáp về nội dung môn học</p>
                <p className="mt-1 max-w-sm text-sm">
                  Đặt câu hỏi bằng ngôn ngữ tự nhiên, AI sẽ trả lời kèm trích dẫn nguồn từ tài liệu.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <MessageBubble key={m.id} message={m} onSelectCitation={setActiveCitation} />
              ))
            )}
            {isSending && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200 px-4 py-3 bg-white">
          <div className="mx-auto max-w-3xl">
            <ChatInput onSend={send} disabled={isSending} />
            <p className="mt-2 text-center text-xs text-slate-400">
              EduRAG có thể mắc lỗi. Luôn kiểm tra thông tin từ tài liệu gốc.
            </p>
          </div>
        </div>
      </section>

      {activeCitation && (
        <PdfViewerPanel citation={activeCitation} onClose={() => setActiveCitation(null)} />
      )}
    </div>
  )
}
