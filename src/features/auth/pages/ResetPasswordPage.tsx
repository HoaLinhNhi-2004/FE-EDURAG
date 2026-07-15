import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Alert, ArrowRightIcon, Button, FormField, Input, LockIcon } from '@/components/ui'
import type { ApiError } from '@/types'
import { authApi } from '@/api/auth.api'
import { AuthShell } from '../components/AuthShell'
import { OtpField } from '../components/OtpField'
import { PasswordStrength } from '../components/PasswordStrength'
import {
  otpSchema,
  resetPasswordSchema,
  type OtpFormValues,
  type ResetPasswordFormValues,
} from '../schemas'

/**
 * UC 2 (bước 2–3) — Đặt lại mật khẩu 2 bước: xác thực OTP → đặt mật khẩu mới.
 * `email` được mang từ màn Quên mật khẩu.
 */
export function ResetPasswordPage({
  email,
  onGoLogin,
}: {
  email: string
  onGoLogin?: () => void
}) {
  const [step, setStep] = useState<'otp' | 'password'>('otp')
  const [resetToken, setResetToken] = useState('')
  const [done, setDone] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otpCode: '' },
  })
  const pwForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const verifyMutation = useMutation({
    mutationFn: (otpCode: string) => authApi.verifyResetOtp({ email, otpCode }),
    onSuccess: (data) => {
      setResetToken(data.resetToken)
      setStep('password')
    },
    onError: (err: ApiError) => setApiError(err.message),
  })

  const resetMutation = useMutation({
    mutationFn: (newPassword: string) => authApi.resetPassword({ token: resetToken, newPassword }),
    onSuccess: () => setDone(true),
    onError: (err: ApiError) => setApiError(err.message),
  })

  const submitOtp = (values: OtpFormValues) => {
    setApiError(null)
    verifyMutation.mutate(values.otpCode)
  }
  const submitPassword = (values: ResetPasswordFormValues) => {
    setApiError(null)
    resetMutation.mutate(values.newPassword)
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900">Đặt lại mật khẩu</h1>
      <p className="mt-1 text-sm text-slate-500">
        {done
          ? 'Hoàn tất.'
          : step === 'otp'
            ? `Nhập mã OTP 6 số đã gửi tới ${email}.`
            : 'Tạo mật khẩu mới cho tài khoản của bạn.'}
      </p>

      {apiError && !done && (
        <Alert variant="error" className="mt-4">
          {apiError}
        </Alert>
      )}

      {done ? (
        <div className="mt-6 flex flex-col gap-4">
          <Alert variant="success">Đổi mật khẩu thành công. Vui lòng đăng nhập lại.</Alert>
          <Button fullWidth onClick={onGoLogin}>
            Đăng nhập
            <ArrowRightIcon width={18} height={18} />
          </Button>
        </div>
      ) : step === 'otp' ? (
        <form onSubmit={otpForm.handleSubmit(submitOtp)} className="mt-6 flex flex-col gap-4" noValidate>
          <FormField
            label="Mã OTP"
            htmlFor="otpCode"
            error={otpForm.formState.errors.otpCode?.message}
            hint="Mã có hiệu lực trong 15 phút"
          >
            <OtpField
              id="otpCode"
              invalid={!!otpForm.formState.errors.otpCode}
              {...otpForm.register('otpCode')}
            />
          </FormField>
          <Button type="submit" fullWidth loading={verifyMutation.isPending}>
            Xác thực OTP
            <ArrowRightIcon width={18} height={18} />
          </Button>
        </form>
      ) : (
        <form
          onSubmit={pwForm.handleSubmit(submitPassword)}
          className="mt-6 flex flex-col gap-4"
          noValidate
        >
          <FormField
            label="Mật khẩu mới"
            htmlFor="newPassword"
            error={pwForm.formState.errors.newPassword?.message}
          >
            <Input
              id="newPassword"
              type="password"
              leftIcon={<LockIcon />}
              placeholder="Tối thiểu 8 ký tự"
              invalid={!!pwForm.formState.errors.newPassword}
              autoComplete="new-password"
              {...pwForm.register('newPassword')}
            />
            <PasswordStrength value={pwForm.watch('newPassword')} />
          </FormField>

          <FormField
            label="Xác nhận mật khẩu"
            htmlFor="confirmPassword"
            error={pwForm.formState.errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              leftIcon={<LockIcon />}
              placeholder="Nhập lại mật khẩu mới"
              invalid={!!pwForm.formState.errors.confirmPassword}
              autoComplete="new-password"
              {...pwForm.register('confirmPassword')}
            />
          </FormField>

          <Button type="submit" fullWidth loading={resetMutation.isPending}>
            Đặt lại mật khẩu
            <ArrowRightIcon width={18} height={18} />
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        <button type="button" onClick={onGoLogin} className="font-medium text-indigo-600 hover:underline">
          Quay lại đăng nhập
        </button>
      </p>
    </AuthShell>
  )
}
