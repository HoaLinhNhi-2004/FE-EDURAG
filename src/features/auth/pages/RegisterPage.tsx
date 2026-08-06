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
  PasswordInput,
  UserIcon,
  PhoneIcon,
  DocumentIcon,
} from '@/components/ui'
import type { ApiError } from '@/types'
import { authApi } from '@/api/auth.api'
import { useAuth } from '@/store/auth'
import { todayISODate } from '@/utils/datetime'
import {
  MAX_FULL_NAME_LENGTH,
  MAX_STUDENT_CODE_LENGTH,
  PHONE_LENGTH,
} from '@/utils/validation'
import { AuthShell } from '../components/AuthShell'
import { PasswordStrength } from '../components/PasswordStrength'
import { registerSchema, type RegisterFormValues } from '../schemas'

/** UC 1 — Màn Đăng ký sinh viên/giảng viên. Thành công → tự đăng nhập (SV) hoặc chờ duyệt (GV). */
export function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

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
      phone: '',
      role: 'STUDENT',
      studentCode: '',
      dateOfBirth: '',
      department: '',
      password: '',
      confirmPassword: '',
    },
  })

  const currentRole = watch('role')

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
      if (variables.role === 'TEACHER') {
        setIsSuccess(true)
      } else {
        loginMutation.mutate({ email: variables.email, password: variables.password })
      }
    },
    onError: (err: ApiError) => setApiError(err.message),
  })

  const submitting = registerMutation.isPending || loginMutation.isPending

  const onSubmit = (values: RegisterFormValues) => {
    setApiError(null)
    const payload: any = {
      role: values.role,
      fullName: values.fullName,
      email: values.email,
      password: values.password,
    }
    if (values.phone?.trim()) {
      payload.phone = values.phone.trim()
    }
    
    if (values.role === 'STUDENT') {
      payload.studentCode = values.studentCode?.trim()
      payload.dateOfBirth = values.dateOfBirth?.trim()
    } else {
      if (values.department?.trim()) payload.department = values.department.trim()
    }
    
    registerMutation.mutate(payload)
  }

  if (isSuccess) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
            <UserIcon width={28} height={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Đăng ký thành công</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-sm">
            Tài khoản giảng viên của bạn đã được tạo thành công ở trạng thái chờ duyệt. Vui lòng đợi quản trị viên phê duyệt trước khi đăng nhập.
          </p>
          <Button className="mt-6" fullWidth onClick={() => navigate('/login')}>
            Quay lại đăng nhập
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900 font-outfit">Tạo tài khoản</h1>
      <p className="mt-1 text-sm text-slate-500">Đăng ký tài khoản để bắt đầu học tập và nghiên cứu.</p>

      {apiError && (
        <Alert variant="error" className="mt-4">
          {apiError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        {/* Role toggle cards */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <label className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl cursor-pointer transition-all ${
            currentRole === 'STUDENT'
              ? 'bg-white shadow-sm border border-slate-200/50 text-indigo-600 font-semibold'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}>
            <input
              type="radio"
              value="STUDENT"
              className="sr-only"
              {...register('role')}
            />
            <span className="text-xs uppercase tracking-wider">Sinh viên</span>
          </label>
          <label className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl cursor-pointer transition-all ${
            currentRole === 'TEACHER'
              ? 'bg-white shadow-sm border border-slate-200/50 text-indigo-600 font-semibold'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}>
            <input
              type="radio"
              value="TEACHER"
              className="sr-only"
              {...register('role')}
            />
            <span className="text-xs uppercase tracking-wider">Giảng viên</span>
          </label>
        </div>

        <FormField label="Họ và tên" htmlFor="fullName" required error={errors.fullName?.message}>
          <Input
            id="fullName"
            leftIcon={<UserIcon />}
            placeholder="Nguyễn Văn An"
            invalid={!!errors.fullName}
            autoComplete="name"
            maxLength={MAX_FULL_NAME_LENGTH}
            {...register('fullName')}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Email"
            htmlFor="email"
            required
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              leftIcon={<MailIcon />}
              placeholder="an.nguyen@student.edu.vn"
              invalid={!!errors.email}
              autoComplete="email"
              {...register('email')}
            />
          </FormField>

          <FormField
            label="Số điện thoại"
            htmlFor="phone"
            error={errors.phone?.message}
          >
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              leftIcon={<PhoneIcon />}
              placeholder="0987654321"
              invalid={!!errors.phone}
              autoComplete="tel"
              maxLength={PHONE_LENGTH}
              {...register('phone')}
            />
          </FormField>
        </div>

        {currentRole === 'STUDENT' ? (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Mã số sinh viên"
              htmlFor="studentCode"
              required
              error={errors.studentCode?.message}
              hint="Không thể thay đổi sau"
            >
              <Input
                id="studentCode"
                leftIcon={<IdCardIcon />}
                placeholder="SV21001234"
                invalid={!!errors.studentCode}
                maxLength={MAX_STUDENT_CODE_LENGTH}
                {...register('studentCode')}
              />
            </FormField>

            <FormField
              label="Ngày sinh"
              htmlFor="dateOfBirth"
              required
              error={errors.dateOfBirth?.message}
              hint="Để xác minh"
            >
              <Input
                id="dateOfBirth"
                type="date"
                leftIcon={<CalendarIcon />}
                // Chặn ngay ở date picker; schema vẫn kiểm lại phòng khi người dùng gõ tay.
                max={todayISODate()}
                invalid={!!errors.dateOfBirth}
                {...register('dateOfBirth')}
              />
            </FormField>
          </div>
        ) : (
          <FormField
            label="Khoa / Bộ môn phụ trách"
            htmlFor="department"
            error={errors.department?.message}
          >
            <Input
              id="department"
              leftIcon={<DocumentIcon />}
              placeholder="Khoa Khoa học máy tính..."
              invalid={!!errors.department}
              {...register('department')}
            />
          </FormField>
        )}

        <FormField label="Mật khẩu" htmlFor="password" required error={errors.password?.message}>
          <PasswordInput
            id="password"
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
          <PasswordInput
            id="confirmPassword"
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
