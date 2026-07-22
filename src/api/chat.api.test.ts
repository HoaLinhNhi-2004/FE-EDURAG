import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import type { SendMessageResponse, WireChatMessage } from '@/types'

// Mock apiClient để test riêng phần map wire -> UI (không gọi mạng thật).
vi.mock('./client', () => ({
  apiClient: { post: vi.fn(), get: vi.fn(), delete: vi.fn() },
}))

import { apiClient } from './client'
import { chatApi } from './chat.api'

const wireAssistant: WireChatMessage = {
  id: 124,
  sessionId: 1,
  senderType: 'ASSISTANT',
  messageOrder: 1,
  content: 'Câu trả lời từ RAG.',
  status: 'COMPLETED',
  noAnswer: false,
  clientRequestId: 'uuid-1',
  errorCode: null,
  completedAt: '2026-07-23T10:00:00Z',
  createdAt: '2026-07-23T10:00:00Z',
  citations: [
    { id: 1, documentId: 10, documentTitle: 'Bài giảng.pdf', pageNumber: 3, sourceText: 'abc' },
  ],
}

const envelope = <T>(data: T) => ({ data: { success: true, message: 'OK', data } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('chatApi.sendMessage (B3)', () => {
  it('đọc data.assistantMessage và map senderType ASSISTANT -> role assistant', async () => {
    const resp: SendMessageResponse = {
      duplicate: false,
      clientRequestId: 'uuid-1',
      userMessageId: 123,
      assistantMessage: wireAssistant,
    }
    ;(apiClient.post as Mock).mockResolvedValue(envelope(resp))

    const result = await chatApi.sendMessage(1, { content: 'Hỏi gì đó', clientRequestId: 'uuid-1' })

    expect(result.duplicate).toBe(false)
    expect(result.userMessageId).toBe(123)
    expect(result.assistantMessage.role).toBe('assistant')
    expect(result.assistantMessage.content).toBe('Câu trả lời từ RAG.')
    expect(result.assistantMessage.citations).toHaveLength(1)
  })
})

describe('chatApi.getMessages (B3)', () => {
  it('đọc data.messages và map senderType -> role', async () => {
    const wireUser: WireChatMessage = { ...wireAssistant, id: 123, senderType: 'USER', content: 'Câu hỏi', citations: [] }
    ;(apiClient.get as Mock).mockResolvedValue(
      envelope({ session: { id: 1, title: 'x', createdAt: '', updatedAt: '' }, messages: [wireUser, wireAssistant], offset: 0, limit: 2, total: 2 }),
    )

    const msgs = await chatApi.getMessages(1)

    expect(msgs).toHaveLength(2)
    expect(msgs[0].role).toBe('user')
    expect(msgs[1].role).toBe('assistant')
  })
})

describe('chatApi.listSessions (B4)', () => {
  it('map {sessions} của BE sang {items} cho FE', async () => {
    ;(apiClient.get as Mock).mockResolvedValue(
      envelope({
        sessions: [{ id: 1, title: 'Phiên 1', createdAt: '', updatedAt: '', lastMessageAt: null }],
        total: 1,
        offset: 0,
        limit: 50,
      }),
    )

    const page = await chatApi.listSessions()

    expect(page.items).toHaveLength(1)
    expect(page.items[0].title).toBe('Phiên 1')
    expect(page.total).toBe(1)
  })
})
