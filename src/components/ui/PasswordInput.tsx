import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Input } from './Input'
import { EyeIcon, EyeOffIcon } from './icons'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  invalid?: boolean
  leftIcon?: ReactNode
}

/**
 * Ô nhập mật khẩu kèm nút hiện/ẩn nội dung.
 *
 * forwardRef để react-hook-form register() gắn ref được, giống Input.
 * Trạng thái hiện/ẩn giữ cục bộ trong từng ô: màn Đổi mật khẩu có 3 ô và người
 * dùng thường chỉ muốn soi lại đúng một ô, không phải bật cả ba.
 * Mặc định luôn là ẩn — không tự nhớ giữa các lần vào trang.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false)

    return (
      <Input
        ref={ref}
        {...props}
        type={visible ? 'text' : 'password'}
        rightSlot={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            // Nút chỉ đổi cách hiển thị nên cần nhãn cho screen reader; aria-pressed
            // để báo trạng thái bật/tắt hiện tại.
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={visible}
            title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="rounded text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
          >
            {visible ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
          </button>
        }
      />
    )
  },
)
