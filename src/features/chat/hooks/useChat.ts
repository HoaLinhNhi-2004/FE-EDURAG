import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { ApiError, ChatMessage } from '@/types'
import { chatApi } from '@/api/chat.api'

/**
 * Quản lý một cuộc trò chuyện (UC 7): giữ danh sách message ở client, tự tạo
 * session ở lần gửi đầu, gọi RAG và ghép câu trả lời. Lịch sử (UC 9) không thuộc
 * phạm vi này nên không tải lại từ server.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const sessionId = useRef<number | null>(null)

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      if (sessionId.current == null) {
        const session = await chatApi.createSession()
        sessionId.current = session.id
      }
      return chatApi.sendMessage(sessionId.current, {
        content,
        clientRequestId: crypto.randomUUID(),
      })
    },
    onSuccess: (assistantMessage) => {
      setMessages((prev) => [...prev, assistantMessage])
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

  const send = (content: string) => {
    const text = content.trim()
    if (!text || mutation.isPending) return
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: text, createdAt: new Date().toISOString() },
    ])
    mutation.mutate(text)
  }

  return { messages, send, isSending: mutation.isPending }
}
