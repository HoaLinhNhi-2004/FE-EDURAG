import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  ArrowRightIcon,
  Button,
  FormField,
  Input,
  LockIcon,
  MailIcon,
} from '@/components/ui'
import type { ApiError } from '@/types'
import { authApi } from '@/api/auth.api'
import { useAuth } from '@/store/auth'
import { AuthShell } from '../components/AuthShell'
import { loginSchema, type LoginFormValues } from '../schemas'

/** UC 3 — Màn Đăng nhập (luồng Client). */
export function LoginPage({
  onGoRegister,
  onGoForgot,
}: {
  onGoRegister?: () => void
  onGoForgot?: () => void
}) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if ('token' in data) {
        login(data.token, data.user)
        // TODO(routing — LN Long): điều hướng theo role. Tạm về trang chủ.
        navigate('/')
      } else {
        // ADMIN cần OTP (UC 19) — màn 2FA do LN Long phụ trách.
        setApiError('Tài khoản Admin cần xác thực OTP ở cổng quản trị (2FA).')
      }
    },
    onError: (err: ApiError) => setApiError(err.message),
  })

  const onSubmit = (values: LoginFormValues) => {
    setApiError(null)
    mutation.mutate({ email: values.email, password: values.password })
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900">Đăng nhập</h1>
      <p className="mt-1 text-sm text-slate-500">Chào mừng trở lại! Đăng nhập để tiếp tục học tập.</p>

      {apiError && (
        <Alert variant="error" className="mt-4">
          {apiError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <FormField label="Email sinh viên" htmlFor="email" error={errors.email?.message}>
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

        <FormField label="Mật khẩu" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            leftIcon={<LockIcon />}
            placeholder="Nhập mật khẩu"
            invalid={!!errors.password}
            autoComplete="current-password"
            {...register('password')}
          />
        </FormField>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              {...register('remember')}
            />
            Ghi nhớ đăng nhập
          </label>
          <button
            type="button"
            onClick={onGoForgot}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Quên mật khẩu?
          </button>
        </div>

        <Button type="submit" fullWidth loading={mutation.isPending}>
          Đăng nhập
          <ArrowRightIcon width={18} height={18} />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Chưa có tài khoản?{' '}
        <button
          type="button"
          onClick={onGoRegister}
          className="font-medium text-indigo-600 hover:underline"
        >
          Đăng ký ngay
        </button>
      </p>
    </AuthShell>
  )
}
