import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError, ChatMessage } from '@/types'
import { chatApi } from '@/api/chat.api'

/**
 * Quản lý một cuộc trò chuyện (UC 7, UC 11).
 * - Không truyền `initialSessionId` → phiên mới, tự tạo ở lần gửi đầu.
 * - Có `initialSessionId` (mở từ Lịch sử — UC 9) → nạp lại hội thoại cũ và chat tiếp trong phiên đó.
 */
export function useChat(initialSessionId?: number) {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const sessionId = useRef<number | null>(initialSessionId ?? null)

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
    if (historyQuery.data) setMessages(historyQuery.data.items)
  }, [historyQuery.data])

  const mutation = useMutation({
    mutationFn: async ({ content, image }: { content: string; image?: File }) => {
      if (sessionId.current == null) {
        const session = await chatApi.createSession()
        sessionId.current = session.id
      }
      return chatApi.sendMessage(
        sessionId.current,
        { content, clientRequestId: crypto.randomUUID() },
        image,
      )
    },
    onSuccess: (assistantMessage) => {
      setMessages((prev) => [...prev, assistantMessage])
      // Lịch sử đổi (phiên mới / thời gian / số tin nhắn) → làm mới danh sách phiên.
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] })
    },
    onError: (err: ApiError) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: err.message,
          createdAt: new Date().toISOString(),
        },
      ])
    },
  })

  const send = (content: string, image?: File) => {
    const text = content.trim()
    if ((!text && !image) || mutation.isPending) return
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
        imageUrl: image ? URL.createObjectURL(image) : undefined,
        createdAt: new Date().toISOString(),
      },
    ])
    mutation.mutate({ content: text, image })
  }

  return {
    messages,
    send,
    isSending: mutation.isPending,
    isLoadingHistory: initialSessionId != null && historyQuery.isPending,
  }
}
