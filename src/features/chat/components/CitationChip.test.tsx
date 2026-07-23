import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Citation } from '@/types'
import { CitationChip } from './CitationChip'

const citation: Citation = {
  id: 1,
  documentId: 10,
  documentTitle: 'Bài giảng AI cơ bản.pdf',
  pageNumber: 3,
  sourceText: 'Mạng nơ-ron gồm ba lớp',
}

describe('CitationChip (UC 7)', () => {
  it('hiển thị tên tài liệu và số trang', () => {
    render(<CitationChip citation={citation} onSelect={() => {}} />)
    expect(screen.getByText('Bài giảng AI cơ bản.pdf')).toBeInTheDocument()
    expect(screen.getByText(/trang 3/)).toBeInTheDocument()
  })

  it('không hiển thị số trang khi pageNumber null', () => {
    render(<CitationChip citation={{ ...citation, pageNumber: null }} onSelect={() => {}} />)
    expect(screen.queryByText(/trang/)).toBeNull()
  })

  it('gọi onSelect với đúng citation khi click', () => {
    const onSelect = vi.fn()
    render(<CitationChip citation={citation} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(citation)
  })
})
