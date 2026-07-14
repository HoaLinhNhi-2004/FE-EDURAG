import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { PaperclipIcon, SendIcon, XIcon } from '@/components/ui'
import { cn } from '@/utils/cn'

// UC 11 — ràng buộc client-side theo exception flow.
const ACCEPTED_TYPES = ['image/png', 'image/jpeg']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

/** Ô nhập câu hỏi. Enter gửi, Shift+Enter xuống dòng. Đính kèm ảnh để tìm kiếm (UC 11). */
export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string, image?: File) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image])
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  const pickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // cho phép chọn lại cùng một file
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError('Định dạng ảnh không hỗ trợ (chỉ PNG, JPG).')
      return
    }
    if (file.size > MAX_SIZE) {
      setImageError('Ảnh vượt quá dung lượng cho phép (tối đa 5MB).')
      return
    }
    setImageError(null)
    setImage(file)
  }

  const submit = () => {
    const text = value.trim()
    if ((!text && !image) || disabled) return
    onSend(text, image ?? undefined)
    setValue('')
    setImage(null)
    setImageError(null)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
      {imageError && <p className="px-2 pb-1 text-xs text-red-600">{imageError}</p>}

      {preview && (
        <div className="relative mb-2 ml-2 inline-block">
          <img src={preview} alt="Ảnh đính kèm" className="h-20 w-20 rounded-lg object-cover" />
          <button
            type="button"
            onClick={() => setImage(null)}
            title="Bỏ ảnh"
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white hover:bg-slate-800"
          >
            <XIcon width={12} height={12} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={pickImage}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title="Đính kèm ảnh (PNG, JPG)"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
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
          disabled={(!value.trim() && !image) || disabled}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition-colors',
            (!value.trim() && !image) || disabled
              ? 'bg-slate-300'
              : 'bg-indigo-600 hover:bg-indigo-700',
          )}
        >
          <SendIcon width={18} height={18} />
        </button>
      </div>
    </div>
  )
}
