import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Alert, ArrowRightIcon, Button, FormField, Input, LockIcon } from '@/components/ui'
import type { ApiError } from '@/types'
import { authApi } from '@/api/auth.api'
import { AuthShell } from '../components/AuthShell'
import { PasswordStrength } from '../components/PasswordStrength'
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas'

/**
 * UC 2 (bước 2) — Đặt lại mật khẩu bằng mã/liên kết từ email + mật khẩu mới.
 * Mã hết hạn/không hợp lệ → báo lỗi, yêu cầu gửi lại.
 */
export function ResetPasswordPage({ onGoLogin }: { onGoLogin?: () => void }) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: '', newPassword: '', confirmPassword: '' },
  })

  const mutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => setDone(true),
    onError: (err: ApiError) => setApiError(err.message),
  })

  const onSubmit = (values: ResetPasswordFormValues) => {
    setApiError(null)
    mutation.mutate({ token: values.token, newPassword: values.newPassword })
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900">Đặt lại mật khẩu</h1>
      <p className="mt-1 text-sm text-slate-500">
        Nhập mã đặt lại từ email và mật khẩu mới của bạn.
      </p>

      {done ? (
        <div className="mt-6 flex flex-col gap-4">
          <Alert variant="success">Đổi mật khẩu thành công. Vui lòng đăng nhập lại.</Alert>
          <Button fullWidth onClick={onGoLogin}>
            Đăng nhập
            <ArrowRightIcon width={18} height={18} />
          </Button>
        </div>
      ) : (
        <>
          {apiError && (
            <Alert variant="error" className="mt-4">
              {apiError}
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
            <FormField
              label="Mã đặt lại"
              htmlFor="token"
              error={errors.token?.message}
              hint="Mã nằm trong email đặt lại mật khẩu"
            >
              <Input
                id="token"
                leftIcon={<LockIcon />}
                placeholder="Nhập mã từ email"
                invalid={!!errors.token}
                {...register('token')}
              />
            </FormField>

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

            <Button type="submit" fullWidth loading={mutation.isPending}>
              Đặt lại mật khẩu
              <ArrowRightIcon width={18} height={18} />
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        <button type="button" onClick={onGoLogin} className="font-medium text-indigo-600 hover:underline">
          Quay lại đăng nhập
        </button>
      </p>
    </AuthShell>
  )
}
