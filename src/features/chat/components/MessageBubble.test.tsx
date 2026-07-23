import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ChatMessage } from '@/types'
import { MessageBubble } from './MessageBubble'

const base = { id: 1, createdAt: '2026-07-23T10:00:00Z' }

describe('MessageBubble (UC 7)', () => {
  it('hiển thị nội dung tin nhắn người dùng', () => {
    const msg: ChatMessage = { ...base, role: 'user', content: 'Mạng nơ-ron là gì?' }
    render(<MessageBubble message={msg} onSelectCitation={() => {}} />)
    expect(screen.getByText('Mạng nơ-ron là gì?')).toBeInTheDocument()
  })

  it('hiển thị câu trả lời kèm thẻ trích dẫn', () => {
    const msg: ChatMessage = {
      ...base,
      role: 'assistant',
      content: 'Gồm 3 lớp.',
      citations: [
        { id: 1, documentId: 10, documentTitle: 'Bài giảng.pdf', pageNumber: 3, sourceText: 'abc' },
      ],
    }
    render(<MessageBubble message={msg} onSelectCitation={() => {}} />)
    expect(screen.getByText('Gồm 3 lớp.')).toBeInTheDocument()
    expect(screen.getByText('Bài giảng.pdf')).toBeInTheDocument()
  })

  it('hiển thị nội dung câu trả lời ngoài phạm vi (noAnswer)', () => {
    const msg: ChatMessage = {
      ...base,
      role: 'assistant',
      content: 'Không tìm thấy thông tin liên quan.',
      noAnswer: true,
      citations: [],
    }
    render(<MessageBubble message={msg} onSelectCitation={() => {}} />)
    expect(screen.getByText('Không tìm thấy thông tin liên quan.')).toBeInTheDocument()
  })

  it('hiển thị tin lỗi khi status = FAILED', () => {
    const msg: ChatMessage = {
      ...base,
      role: 'assistant',
      content: 'Có lỗi xảy ra, vui lòng thử lại.',
      status: 'FAILED',
    }
    render(<MessageBubble message={msg} onSelectCitation={() => {}} />)
    expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument()
  })
})
