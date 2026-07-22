import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, ArrowRightIcon, Button, FormField, Input, LockIcon } from '@/components/ui'
import type { ApiError } from '@/types'
import { authApi } from '@/api/auth.api'
import { AuthShell } from '../components/AuthShell'
import { PasswordStrength } from '../components/PasswordStrength'
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas'

/**
 * UC 2 — Đặt lại mật khẩu (1 bước, đã chốt B7): người dùng mở link trong email,
 * token nằm ở query param `/reset?token=...`. FE chỉ nhập mật khẩu mới rồi submit
 * {token, newPassword}. KHÔNG còn bước nhập OTP.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const onGoLogin = () => navigate('/login')
  const [done, setDone] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const resetMutation = useMutation({
    mutationFn: (newPassword: string) => authApi.resetPassword({ token, newPassword }),
    onSuccess: () => setDone(true),
    onError: (err: ApiError) => setApiError(err.message),
  })

  const onSubmit = (values: ResetPasswordFormValues) => {
    setApiError(null)
    resetMutation.mutate(values.newPassword)
  }

  // Không có token trong link → link hỏng/thiếu, không hiển thị form.
  if (!token && !done) {
    return (
      <AuthShell>
        <h1 className="text-2xl font-bold text-slate-900">Liên kết không hợp lệ</h1>
        <p className="mt-1 text-sm text-slate-500">
          Liên kết đặt lại mật khẩu thiếu mã xác thực hoặc đã hết hạn. Vui lòng yêu cầu gửi lại.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button fullWidth onClick={() => navigate('/forgot')}>
            Gửi lại yêu cầu đặt lại
            <ArrowRightIcon width={18} height={18} />
          </Button>
          <button
            type="button"
            onClick={onGoLogin}
            className="text-center text-sm font-medium text-indigo-600 hover:underline"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900">Đặt lại mật khẩu</h1>
      <p className="mt-1 text-sm text-slate-500">
        {done ? 'Hoàn tất.' : 'Tạo mật khẩu mới cho tài khoản của bạn.'}
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
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
          <FormField label="Mật khẩu mới" htmlFor="newPassword" error={errors.newPassword?.message}>
            <Input
              id="newPassword"
              type="password"
              leftIcon={<LockIcon />}
              placeholder="Tối thiểu 8 ký tự"
              invalid={!!errors.newPassword}
              autoComplete="new-password"
              {...register('newPassword')}
            />
            <PasswordStrength value={watch('newPassword')} />
          </FormField>

          <FormField
            label="Xác nhận mật khẩu"
            htmlFor="confirmPassword"
            error={errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              leftIcon={<LockIcon />}
              placeholder="Nhập lại mật khẩu mới"
              invalid={!!errors.confirmPassword}
              autoComplete="new-password"
              {...register('confirmPassword')}
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
