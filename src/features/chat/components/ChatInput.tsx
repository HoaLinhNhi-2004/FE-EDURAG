import { useState, type KeyboardEvent } from 'react'
import { PaperclipIcon, SendIcon } from '@/components/ui'
import { cn } from '@/utils/cn'

/** Ô nhập câu hỏi. Enter để gửi, Shift+Enter xuống dòng. Nút đính kèm ảnh (UC 11) tạm disable. */
export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState('')

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
      <button
        type="button"
        disabled
        title="Đính kèm ảnh (sắp có)"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 disabled:cursor-not-allowed"
      >
        <PaperclipIcon />
      </button>
      <textarea
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Đặt câu hỏi về nội dung môn học..."
        className="max-h-32 flex-1 resize-none bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim() || disabled}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition-colors',
          !value.trim() || disabled ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700',
        )}
      >
        <SendIcon width={18} height={18} />
      </button>
    </div>
  )
}
