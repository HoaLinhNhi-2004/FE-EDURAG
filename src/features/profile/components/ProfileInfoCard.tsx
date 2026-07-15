import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  CalendarIcon,
  FormField,
  IdCardIcon,
  Input,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from '@/components/ui'
import type { ApiError, User } from '@/types'
import { profileApi } from '@/api/profile.api'
import { updateProfileSchema, type UpdateProfileFormValues } from '../schemas'

/** UC 4 + 5 — Hiển thị & cập nhật thông tin cá nhân. MSV/email chỉ đọc. */
export function ProfileInfoCard({ profile }: { profile: User }) {
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      fullName: profile.fullName,
      dateOfBirth: profile.dateOfBirth ?? '',
      phone: profile.phone ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: profileApi.update,
    onSuccess: (updated) => {
      queryClient.setQueryData(['auth', 'me'], updated) // phản ánh ngay + cập nhật header
      setSaved(true)
      setApiError(null)
    },
    onError: (err: ApiError) => {
      setApiError(err.message)
      setSaved(false)
    },
  })

  const onSubmit = (values: UpdateProfileFormValues) => {
    setSaved(false)
    setApiError(null)
    mutation.mutate({
      fullName: values.fullName,
      dateOfBirth: values.dateOfBirth,
      phone: values.phone || undefined,
    })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Thông tin cá nhân</h2>
      <p className="mt-1 text-sm text-slate-500">Cập nhật họ tên, ngày sinh và số điện thoại.</p>

      {apiError && (
        <Alert variant="error" className="mt-4">
          {apiError}
        </Alert>
      )}
      {saved && (
        <Alert variant="success" className="mt-4">
          Cập nhật thông tin thành công.
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4" noValidate>
        <FormField label="Họ và tên" htmlFor="fullName" required error={errors.fullName?.message}>
          <Input id="fullName" leftIcon={<UserIcon />} invalid={!!errors.fullName} {...register('fullName')} />
        </FormField>

        <FormField label="Email" htmlFor="email" hint="Email không thể thay đổi">
          <Input id="email" leftIcon={<MailIcon />} value={profile.email} disabled readOnly />
        </FormField>

        {profile.studentCode && (
          <FormField
            label="Mã số sinh viên"
            htmlFor="studentCode"
            hint="MSV không thể thay đổi sau khi đăng ký"
          >
            <Input
              id="studentCode"
              leftIcon={<IdCardIcon />}
              value={profile.studentCode}
              disabled
              readOnly
            />
          </FormField>
        )}

        <FormField label="Ngày sinh" htmlFor="dateOfBirth" required error={errors.dateOfBirth?.message}>
          <Input
            id="dateOfBirth"
            type="date"
            leftIcon={<CalendarIcon />}
            invalid={!!errors.dateOfBirth}
            {...register('dateOfBirth')}
          />
        </FormField>

        <FormField label="Số điện thoại" htmlFor="phone" error={errors.phone?.message}>
          <Input
            id="phone"
            leftIcon={<PhoneIcon />}
            placeholder="09xxxxxxxx"
            invalid={!!errors.phone}
            {...register('phone')}
          />
        </FormField>

        <div className="flex justify-end">
          <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </section>
  )
}
