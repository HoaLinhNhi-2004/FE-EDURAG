import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  ArrowRightIcon,
  Button,
  CalendarIcon,
  FormField,
  IdCardIcon,
  Input,
  LockIcon,
  MailIcon,
  UserIcon,
} from '@/components/ui'
import type { ApiError } from '@/types'
import { authApi } from '@/api/auth.api'
import { useAuth } from '@/store/auth'
import { AuthShell } from '../components/AuthShell'
import { PasswordStrength } from '../components/PasswordStrength'
import { registerSchema, type RegisterFormValues } from '../schemas'

/** UC 1 — Màn Đăng ký sinh viên. Thành công → tự đăng nhập, vào Trang chủ. */
export function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      studentCode: '',
      dateOfBirth: '',
      password: '',
      confirmPassword: '',
    },
  })

  // register không trả JWT → đăng ký xong tự đăng nhập để đạt UC 1 ("tự động đăng nhập").
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if ('token' in data) {
        login(data.token, data.user)
        navigate('/')
      }
    },
    onError: (err: ApiError) => setApiError(err.message),
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (_data, variables) => {
      loginMutation.mutate({ email: variables.email, password: variables.password })
    },
    onError: (err: ApiError) => setApiError(err.message),
  })

  const submitting = registerMutation.isPending || loginMutation.isPending

  const onSubmit = (values: RegisterFormValues) => {
    setApiError(null)
    registerMutation.mutate({
      role: 'STUDENT',
      fullName: values.fullName,
      email: values.email,
      password: values.password,
      studentCode: values.studentCode,
      dateOfBirth: values.dateOfBirth,
    })
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h1>
      <p className="mt-1 text-sm text-slate-500">Đăng ký tài khoản sinh viên để bắt đầu.</p>

      {apiError && (
        <Alert variant="error" className="mt-4">
          {apiError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <FormField label="Họ và tên" htmlFor="fullName" required error={errors.fullName?.message}>
          <Input
            id="fullName"
            leftIcon={<UserIcon />}
            placeholder="Nguyễn Văn An"
            invalid={!!errors.fullName}
            autoComplete="name"
            {...register('fullName')}
          />
        </FormField>

        <FormField
          label="Email"
          htmlFor="email"
          required
          error={errors.email?.message}
          hint="Email dùng để đăng nhập và nhận thông báo"
        >
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Mã số sinh viên"
            htmlFor="studentCode"
            required
            error={errors.studentCode?.message}
            hint="Bắt buộc • Không thể thay đổi sau"
          >
            <Input
              id="studentCode"
              leftIcon={<IdCardIcon />}
              placeholder="SV2021001234"
              invalid={!!errors.studentCode}
              {...register('studentCode')}
            />
          </FormField>

          <FormField
            label="Ngày sinh"
            htmlFor="dateOfBirth"
            required
            error={errors.dateOfBirth?.message}
            hint="Bắt buộc để xác minh"
          >
            <Input
              id="dateOfBirth"
              type="date"
              leftIcon={<CalendarIcon />}
              invalid={!!errors.dateOfBirth}
              {...register('dateOfBirth')}
            />
          </FormField>
        </div>

        <FormField label="Mật khẩu" htmlFor="password" required error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            leftIcon={<LockIcon />}
            placeholder="Tối thiểu 8 ký tự"
            invalid={!!errors.password}
            autoComplete="new-password"
            {...register('password')}
          />
          <PasswordStrength value={watch('password')} />
        </FormField>

        <FormField
          label="Xác nhận mật khẩu"
          htmlFor="confirmPassword"
          required
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            leftIcon={<LockIcon />}
            placeholder="Nhập lại mật khẩu"
            invalid={!!errors.confirmPassword}
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
        </FormField>

        <Button type="submit" fullWidth loading={submitting}>
          Tạo tài khoản
          <ArrowRightIcon width={18} height={18} />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Đã có tài khoản?{' '}
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
