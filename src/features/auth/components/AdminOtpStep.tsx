import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Alert, ArrowRightIcon, Button, FormField } from '@/components/ui'
import type { ApiError, LoginResponse } from '@/types'
import { authApi } from '@/api/auth.api'
import { OtpField } from './OtpField'
import { otpSchema, type OtpFormValues } from '../schemas'

/** UC 19 — Bước 2FA của Admin: nhập OTP sau khi đăng nhập đúng email/mật khẩu. */
export function AdminOtpStep({
  email,
  onVerified,
  onBack,
}: {
  email: string
  onVerified: (data: LoginResponse) => void
  onBack: () => void
}) {
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema), defaultValues: { otpCode: '' } })

  const mutation = useMutation({
    mutationFn: (otpCode: string) => authApi.verifyOtp({ email, otpCode }),
    onSuccess: (data) => {
      if ('token' in data) onVerified(data)
      else setApiError('Xác thực OTP thất bại.')
    },
    onError: (err: ApiError) => setApiError(err.message),
  })

  const onSubmit = (values: OtpFormValues) => {
    setApiError(null)
    mutation.mutate(values.otpCode)
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Xác thực 2 lớp (2FA)</h1>
      <p className="mt-1 text-sm text-slate-500">
        Nhập mã OTP 6 số đã gửi tới email quản trị <span className="font-medium">{email}</span>.
      </p>

      {apiError && (
        <Alert variant="error" className="mt-4">
          {apiError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <FormField label="Mã OTP" htmlFor="otpCode" error={errors.otpCode?.message}>
          <OtpField id="otpCode" invalid={!!errors.otpCode} {...register('otpCode')} />
        </FormField>
        <Button type="submit" fullWidth loading={mutation.isPending}>
          Xác thực
          <ArrowRightIcon width={18} height={18} />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        <button type="button" onClick={onBack} className="font-medium text-indigo-600 hover:underline">
          Quay lại đăng nhập
        </button>
      </p>
    </>
  )
}
