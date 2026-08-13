import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError, ChatMessage } from '@/types'
import { chatApi } from '@/api/chat.api'

/**
 * Quản lý một cuộc trò chuyện (UC 7).
 * - Không truyền `initialSessionId` → phiên mới, tự tạo ở lần gửi đầu.
 * - Có `initialSessionId` (mở từ Lịch sử — UC 9) → nạp lại hội thoại cũ và chat tiếp.
 * - `startNewSession()` → bỏ phiên đang mở, quay về khung chat trống; phiên mới chỉ
 *   thực sự được tạo ở BE khi người dùng gửi câu hỏi đầu tiên (không tạo phiên rỗng).
 * - `activeSessionId` → id phiên đang mở (kể cả phiên vừa tự tạo), để nơi gọi đồng bộ
 *   vào URL `?session=<id>`; nhờ đó F5 giữa chừng không mất hội thoại.
 *
 * Chat là ĐỒNG BỘ (chốt B7): gửi → BE trả 200 kèm assistantMessage COMPLETED, render
 * thẳng, không poll. Chỉ khi retry trùng clientRequestId đang xử lý (duplicate + PENDING)
 * mới nạp lại lịch sử theo id.
 *
 * Flow khi gửi:
 * 1. Thêm optimistic userMessage (id tạm `u-<timestamp>`) ngay lập tức để UI phản hồi nhanh.
 * 2. Khi BE phản hồi OK → thay thế optimistic bằng userMessageId thật + thêm assistantMessage.
 * 3. Khi BE báo lỗi → thêm assistantMessage FAILED để báo cho người dùng.
 */
export function useChat(initialSessionId?: number) {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  // Ref = nguồn đọc đồng bộ ngay trong mutation; state chỉ để render/đồng bộ URL.
  const sessionId = useRef<number | null>(initialSessionId ?? null)
  const [activeSessionId, setActiveSessionId] = useState<number | null>(initialSessionId ?? null)
  // Phiên do chính hook này tạo ở lần gửi đầu. Nhớ lại để khi nơi gọi ghi
  // `?session=<id>` vào URL thì không hiểu nhầm thành "mở phiên khác" mà xóa hội
  // thoại đang hiển thị và nạp lại từ BE. Mọi lần gán ref đều kèm một setState nên
  // giá trị đọc lúc render luôn khớp với lần render hiện tại.
  const selfCreatedId = useRef<number | null>(null)

  // Chỉ "khôi phục" khi mở phiên do nơi khác chỉ định (Lịch sử / dán URL / F5).
  const isRestoring = initialSessionId != null && initialSessionId !== selfCreatedId.current

  // Đổi phiên (hoặc mở phiên mới) → reset hội thoại đang hiển thị.
  useEffect(() => {
    // URL vừa được đồng bộ với phiên đang chat → không phải đổi phiên, giữ nguyên.
    if (initialSessionId != null && initialSessionId === selfCreatedId.current) return
    sessionId.current = initialSessionId ?? null
    setActiveSessionId(initialSessionId ?? null)
    setMessages([])
  }, [initialSessionId])

  // Nạp hội thoại cũ khi mở một phiên có sẵn.
  const historyQuery = useQuery({
    queryKey: ['chat', 'messages', initialSessionId],
    queryFn: () => chatApi.getMessages(initialSessionId as number),
    enabled: isRestoring,
  })

  useEffect(() => {
    if (historyQuery.data) setMessages(historyQuery.data)
  }, [historyQuery.data])

  // Bắt đầu cuộc trò chuyện mới: quên phiên đang mở + xóa hội thoại đang hiển thị.
  // KHÔNG gọi BE ở đây — tránh đẻ ra phiên rỗng trong Lịch sử (UC 9) nếu người dùng
  // bấm "mới" rồi bỏ đi mà không hỏi gì.
  const startNewSession = useCallback(() => {
    sessionId.current = null
    selfCreatedId.current = null
    setActiveSessionId(null)
    setMessages([])
  }, [])

  const reloadMessages = () => {
    if (sessionId.current != null) {
      queryClient
        .fetchQuery({
          queryKey: ['chat', 'messages', sessionId.current],
          queryFn: () => chatApi.getMessages(sessionId.current as number),
        })
        .then((msgs) => setMessages(msgs))
        .catch(() => {})
    }
  }

  const mutation = useMutation({
    mutationFn: async ({ content, optimisticId }: { content: string; optimisticId: string }) => {
      if (sessionId.current == null) {
        // Dùng câu hỏi đầu tiên làm tiêu đề phiên (tối đa 60 ký tự)
        const title = content.length > 60 ? content.slice(0, 57) + '…' : content
        const session = await chatApi.createSession({ title })
        sessionId.current = session.id
        selfCreatedId.current = session.id
        setActiveSessionId(session.id)
      }
      return chatApi.sendMessage(sessionId.current, {
        content,
        clientRequestId: crypto.randomUUID(),
      }).then((result) => ({ ...result, optimisticId }))
    },
    onSuccess: (result) => {
      if (result.duplicate && result.assistantMessage.status === 'PENDING') {
        // Retry trùng đang xử lý → nạp lại lịch sử để có trạng thái mới nhất
        reloadMessages()
        return
      }

      // Thay thế optimistic userMessage (id tạm) bằng userMessageId thật từ BE
      // rồi thêm assistantMessage. Dùng functional update để tránh stale closure.
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== result.optimisticId)
        const confirmedUser: ChatMessage = {
          id: result.userMessageId,
          role: 'user',
          content: prev.find((m) => m.id === result.optimisticId)?.content ?? '',
          createdAt: new Date().toISOString(),
          status: 'COMPLETED',
        }
        return [...withoutOptimistic, confirmedUser, result.assistantMessage]
      })

      // Lịch sử đổi (phiên mới / thời gian) → làm mới danh sách phiên.
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] })
    },
    onError: (err: ApiError) => {
      // Giữ optimistic userMessage, thêm assistantMessage lỗi
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: err.message,
          status: 'FAILED',
          createdAt: new Date().toISOString(),
        },
      ])
    },
  })

  const send = (content: string) => {
    const text = content.trim()
    if (!text || mutation.isPending) return

    // Thêm optimistic userMessage với id tạm để UI phản hồi ngay lập tức
    const optimisticId = `u-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      },
    ])
    mutation.mutate({ content: text, optimisticId })
  }

  return {
    messages,
    send,
    startNewSession,
    activeSessionId,
    isSending: mutation.isPending,
    isLoadingHistory: isRestoring && historyQuery.isPending,
  }
}
