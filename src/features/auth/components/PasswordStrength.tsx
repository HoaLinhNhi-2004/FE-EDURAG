import { cn } from '@/utils/cn'

/** Chấm điểm độ mạnh mật khẩu đơn giản: 0 (rỗng) → 3 (mạnh). */
export function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[a-z]/.test(pw) && /[A-Z0-9]/.test(pw)) score++
  if (pw.length >= 12 || /[^A-Za-z0-9]/.test(pw)) score++
  return Math.max(1, score) as 1 | 2 | 3
}

const META: Record<1 | 2 | 3, { label: string; bar: string; text: string }> = {
  1: { label: 'Mật khẩu yếu', bar: 'bg-red-500', text: 'text-red-600' },
  2: { label: 'Mật khẩu trung bình', bar: 'bg-yellow-500', text: 'text-yellow-600' },
  3: { label: 'Mật khẩu mạnh', bar: 'bg-green-500', text: 'text-green-600' },
}

export function PasswordStrength({ value }: { value: string }) {
  const score = getPasswordStrength(value)
  if (score === 0) return null
  const meta = META[score]

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full', i <= score ? meta.bar : 'bg-slate-200')}
          />
        ))}
      </div>
      <p className={cn('mt-1 text-xs', meta.text)}>{meta.label}</p>
    </div>
  )
}
