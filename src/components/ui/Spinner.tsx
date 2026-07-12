import { cn } from '@/utils/cn'

interface SpinnerProps {
  className?: string
}

/** Vòng xoay loading dùng chung (nút đang submit, trạng thái tải dữ liệu). */
export function Spinner({ className }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin', className)}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Đang tải"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
      />
    </svg>
  )
}
