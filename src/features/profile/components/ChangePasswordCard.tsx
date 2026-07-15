import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Alert, Button, FormField, Input, LockIcon } from '@/components/ui'
import type { ApiError } from '@/types'
import { profileApi } from '@/api/profile.api'
import { useAuth } from '@/store/auth'
import { PasswordStrength } from '@/features/auth/components/PasswordStrength'
import { changePasswordSchema, type ChangePasswordFormValues } from '@/features/auth/schemas'

/** UC 6 — Đổi mật khẩu. Mới ≠ cũ + khớp xác nhận. Đổi xong BE vô hiệu JWT cũ → đăng nhập lại. */
export function ChangePasswordCard() {
  const { logout } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  })

  // Xóa lỗi từ server khi người dùng gõ lại, tránh hiển thị lỗi cũ đã lỗi thời.
  const [oldPw, newPw, confirmPw] = watch(['oldPassword', 'newPassword', 'confirmPassword'])
  useEffect(() => {
    setApiError(null)
  }, [oldPw, newPw, confirmPw])

  const mutation = useMutation({
    mutationFn: profileApi.changePassword,
    onSuccess: () => setDone(true),
    onError: (err: ApiError) => setApiError(err.message),
  })

  const onSubmit = (values: ChangePasswordFormValues) => {
    setApiError(null)
    mutation.mutate({ oldPassword: values.oldPassword, newPassword: values.newPassword })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Đổi mật khẩu</h2>
      <p className="mt-1 text-sm text-slate-500">
        Sau khi đổi mật khẩu, bạn cần đăng nhập lại để tiếp tục.
      </p>

      {done ? (
        <div className="mt-5 flex flex-col gap-4">
          <Alert variant="success">Đổi mật khẩu thành công. Vui lòng đăng nhập lại.</Alert>
          <div className="flex justify-end">
            <Button onClick={logout}>Đăng nhập lại</Button>
          </div>
        </div>
      ) : (
        <>
          {apiError && (
            <Alert variant="error" className="mt-4">
              {apiError}
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4" noValidate>
            <FormField
              label="Mật khẩu hiện tại"
              htmlFor="oldPassword"
              required
              error={errors.oldPassword?.message}
            >
              <Input
                id="oldPassword"
                type="password"
                leftIcon={<LockIcon />}
                invalid={!!errors.oldPassword}
                autoComplete="current-password"
                {...register('oldPassword')}
              />
            </FormField>

            <FormField
              label="Mật khẩu mới"
              htmlFor="newPassword"
              required
              error={errors.newPassword?.message}
            >
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
              label="Xác nhận mật khẩu mới"
              htmlFor="confirmPassword"
              required
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

            <div className="flex justify-end">
              <Button type="submit" loading={mutation.isPending}>
                Đổi mật khẩu
              </Button>
            </div>
          </form>
        </>
      )}
    </section>
  )
}
