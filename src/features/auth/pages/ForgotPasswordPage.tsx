import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Alert, ArrowRightIcon, Button, FormField, Input, MailIcon } from '@/components/ui'
import type { ApiError } from '@/types'
import { authApi } from '@/api/auth.api'
import { AuthShell } from '../components/AuthShell'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas'

/**
 * UC 2 (bước 1) — Quên mật khẩu: nhập email nhận mã/liên kết đặt lại.
 * Luôn hiển thị thông báo chung dù email có tồn tại hay không (chống dò tài khoản).
 */
export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [apiError, setApiError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => setSent(true),
    onError: (err: ApiError) => setApiError(err.message),
  })

  const onSubmit = (values: ForgotPasswordFormValues) => {
    setApiError(null)
    mutation.mutate(values)
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900">Quên mật khẩu</h1>
      <p className="mt-1 text-sm text-slate-500">
        Nhập email đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
      </p>

      {sent ? (
        <div className="mt-6 flex flex-col gap-4">
          <Alert variant="success">
            Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu tới đó.
            Vui lòng mở email và bấm vào liên kết để tiếp tục (kiểm tra cả mục Spam). Liên kết có
            hiệu lực trong 15 phút.
          </Alert>
          <Button fullWidth variant="secondary" onClick={() => navigate('/login')}>
            Quay lại đăng nhập
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
            <FormField label="Email đã đăng ký" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                leftIcon={<MailIcon />}
                placeholder="sv2021001234@student.edu.vn"
                invalid={!!errors.email}
                autoComplete="email"
                {...register('email')}
              />
            </FormField>
            <Button type="submit" fullWidth loading={mutation.isPending}>
              Gửi hướng dẫn
              <ArrowRightIcon width={18} height={18} />
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        Nhớ mật khẩu rồi?{' '}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="font-medium text-indigo-600 hover:underline"
        >
          Đăng nhập
        </button>
      </p>
    </AuthShell>
  )
}
