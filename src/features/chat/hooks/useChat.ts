import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError, ChatMessage } from '@/types'
import { chatApi } from '@/api/chat.api'

/**
 * Quản lý một cuộc trò chuyện (UC 7).
 * - Không truyền `initialSessionId` → phiên mới, tự tạo ở lần gửi đầu.
 * - Có `initialSessionId` (mở từ Lịch sử — UC 9) → nạp lại hội thoại cũ và chat tiếp.
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
  const sessionId = useRef<number | null>(initialSessionId ?? null)
  // Lưu id optimistic của user message để thay thế sau khi BE phản hồi
  const optimisticUserIdRef = useRef<string | null>(null)

  // Đổi phiên (hoặc mở phiên mới) → reset hội thoại đang hiển thị.
  useEffect(() => {
    sessionId.current = initialSessionId ?? null
    setMessages([])
  }, [initialSessionId])

  // Nạp hội thoại cũ khi mở một phiên có sẵn.
  const historyQuery = useQuery({
    queryKey: ['chat', 'messages', initialSessionId],
    queryFn: () => chatApi.getMessages(initialSessionId as number),
    enabled: initialSessionId != null,
  })

  useEffect(() => {
    if (historyQuery.data) setMessages(historyQuery.data)
  }, [historyQuery.data])

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
        const session = await chatApi.createSession()
        sessionId.current = session.id
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
    optimisticUserIdRef.current = optimisticId
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
    isSending: mutation.isPending,
    isLoadingHistory: initialSessionId != null && historyQuery.isPending,
  }
}
