import { forwardRef, type InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui'

/** Ô nhập OTP 6 chữ số — canh giữa, giãn ký tự, bàn phím số. */
export const OtpField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function OtpField(props, ref) {
  return (
    <Input
      ref={ref}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="______"
      className="text-center text-lg tracking-[0.5em]"
      {...props}
    />
  )
})
