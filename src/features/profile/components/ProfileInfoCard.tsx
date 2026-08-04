import { useState, useRef, useEffect, useCallback } from 'react'
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
  UserAvatar,
  Spinner,
} from '@/components/ui'
import type { ApiError, User } from '@/types'
import { profileApi } from '@/api/profile.api'
import { updateProfileSchema, type UpdateProfileFormValues } from '../schemas'

// ─── Local Custom Icons ──────────────────────────────────────────────────────
const XIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
)

const ImageIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
)

const CameraIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
)

const TrashIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
)

// ─── Predefined Illustration Data ────────────────────────────────────────────
const ILLUSTRATIONS = [
  {
    name: 'flamingo.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full rounded-full">
  <defs>
    <linearGradient id="grad-flamingo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff758c" />
      <stop offset="100%" stop-color="#ff7eb3" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="50" fill="url(#grad-flamingo)" />
  <path d="M 35,80 C 38,68 43,58 48,50 C 51,44 50,32 46,27 C 42,22 34,25 34,31 C 34,35 41,33 40,40 C 38,47 28,56 23,67" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
  <path d="M 46,27 C 48,24 54,22 60,26 C 62,28 59,31 56,30 C 51,29 48,28 46,27 Z" fill="#ffffff" />
  <circle cx="43" cy="30" r="2" fill="#333333" />
</svg>`
  },
  {
    name: 'desert.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full rounded-full">
  <defs>
    <linearGradient id="grad-desert" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff9a9e" />
      <stop offset="100%" stop-color="#fecfef" />
    </linearGradient>
    <linearGradient id="grad-dune" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f6d365" />
      <stop offset="100%" stop-color="#fda085" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="50" fill="url(#grad-desert)" />
  <circle cx="50" cy="32" r="8" fill="#ffffff" />
  <path d="M 0,72 Q 25,58 50,72 T 100,62 L 100,100 L 0,100 Z" fill="url(#grad-dune)" />
  <path d="M 0,86 Q 40,72 80,92 T 100,87 L 100,100 L 0,100 Z" fill="#fda085" opacity="0.8" />
</svg>`
  },
  {
    name: 'cottage.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full rounded-full">
  <defs>
    <linearGradient id="grad-cottage" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4facfe" />
      <stop offset="100%" stop-color="#00f2fe" />
    </linearGradient>
    <linearGradient id="grad-hill" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#43e97b" />
      <stop offset="100%" stop-color="#38f9d7" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="50" fill="url(#grad-cottage)" />
  <path d="M -10,82 Q 30,52 70,77 T 110,72 L 110,110 L -10,110 Z" fill="url(#grad-hill)" />
  <path d="M 35,77 C 35,62 65,62 65,77 Z" fill="#b76e79" />
  <circle cx="50" cy="74" r="8" fill="#fda085" stroke="#ffffff" stroke-width="2" />
  <circle cx="48" cy="74" r="1.5" fill="#333333" />
</svg>`
  },
  {
    name: 'valley.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-full h-full rounded-full">
  <defs>
    <linearGradient id="grad-valley" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fa709a" />
      <stop offset="100%" stop-color="#fee140" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="50" fill="url(#grad-valley)" />
  <path d="M 0,100 L 30,52 L 60,82 L 80,62 L 100,92 L 100,100 Z" fill="#6c5ce7" opacity="0.6" />
  <path d="M 0,100 L 20,72 L 45,57 L 75,92 L 100,77 L 100,100 Z" fill="#a29bfe" opacity="0.8" />
</svg>`
  }
]

// ─── Modal Component for Avatar Upload ────────────────────────────────────────
interface AvatarModalProps {
  profile: User
  onClose: () => void
}

function AvatarModal({ profile, onClose }: AvatarModalProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  const uploadMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: (avatarData) => {
      setErrorMsg(null)
      queryClient.setQueryData<User>(['auth', 'me'], (oldUser) => {
        if (!oldUser) return oldUser
        return {
          ...oldUser,
          // Upload đã thành công nên mặc định là có avatar, kể cả khi BE không trả descriptor.
          avatarAvailable: avatarData?.avatarAvailable ?? true,
          avatarUrl: avatarData?.avatarUrl ?? null,
          avatarMimeType: avatarData?.avatarMimeType ?? null,
        }
      })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me', 'avatar'] })
      onClose()
    },
    onError: (error: ApiError) => {
      setErrorMsg(error.message || 'Tải ảnh đại diện thất bại.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: profileApi.deleteAvatar,
    onSuccess: (avatarData) => {
      setErrorMsg(null)
      queryClient.setQueryData<User>(['auth', 'me'], (oldUser) => {
        if (!oldUser) return oldUser
        return {
          ...oldUser,
          avatarAvailable: avatarData?.avatarAvailable ?? false,
          avatarUrl: avatarData?.avatarUrl ?? null,
          avatarMimeType: avatarData?.avatarMimeType ?? null,
        }
      })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me', 'avatar'] })
      onClose()
    },
    onError: (error: ApiError) => {
      setErrorMsg(error.message || 'Xóa ảnh đại diện thất bại.')
    },
  })

  const validateAndUpload = (file: File) => {
    setErrorMsg(null)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg('Định dạng ảnh không được hỗ trợ (chấp nhận JPEG, PNG, WebP).')
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg('Kích thước ảnh đại diện không vượt quá 5MB.')
      return
    }
    uploadMutation.mutate(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Xoá value ngay để lần sau chọn lại đúng file vừa lỗi vẫn bắn onChange.
    e.target.value = ''
    if (file) {
      validateAndUpload(file)
    }
  }

  const handleSelectIllustration = async (svgContent: string, filename: string) => {
    setErrorMsg(null)
    setIsConverting(true)
    try {
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          // Không lấy được canvas context thì phải thoát trạng thái đang xử lý,
          // nếu không overlay loading sẽ kẹt vĩnh viễn.
          URL.revokeObjectURL(url)
          setIsConverting(false)
          setErrorMsg('Trình duyệt không hỗ trợ xử lý ảnh minh họa.')
          return
        }
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 512, 512)
        ctx.drawImage(img, 0, 0, 512, 512)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], filename, { type: 'image/png' })
            uploadMutation.mutate(file)
          } else {
            setErrorMsg('Không thể chuyển đổi hình minh họa.')
          }
          URL.revokeObjectURL(url)
          setIsConverting(false)
        }, 'image/png')
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        setIsConverting(false)
        setErrorMsg('Không thể chuyển đổi hình minh họa.')
      }
      img.src = url
    } catch {
      setIsConverting(false)
      setErrorMsg('Đã xảy ra lỗi khi xử lý hình minh họa.')
    }
  }

  // Đang gọi API thì khoá đường thoát để không đóng modal giữa chừng.
  const isBusy = uploadMutation.isPending || deleteMutation.isPending || isConverting

  // Đóng bằng phím Esc (UC 5 — mọi popup phải thoát được bằng bàn phím).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isBusy, onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-modal-title"
      onClick={(e) => {
        // Chỉ đóng khi bấm đúng lớp nền, không phải bấm xuyên từ nội dung modal.
        if (e.target === e.currentTarget && !isBusy) onClose()
      }}
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 relative overflow-hidden flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
          <span id="avatar-modal-title" className="flex-1 text-center text-base font-semibold text-slate-800">
            Thêm ảnh hồ sơ
          </span>
          {/* Ô trống cân đối với nút đóng để tiêu đề nằm đúng giữa */}
          <span className="w-9 shrink-0" aria-hidden="true" />
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <Alert variant="error" className="py-2.5 text-xs">
            {errorMsg}
          </Alert>
        )}

        {/* Illustration Slider */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Duyệt xem hình minh họa
          </span>
          <div className="flex gap-4 overflow-x-auto py-2 px-1 scrollbar-none snap-x snap-mandatory">
            {ILLUSTRATIONS.map((ill, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectIllustration(ill.svg, ill.name)}
                className="w-16 h-16 rounded-full flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200 border-2 border-transparent hover:border-indigo-500 snap-center outline-none"
                dangerouslySetInnerHTML={{ __html: ill.svg }}
              />
            ))}
          </div>
        </div>

        {/* Actions List */}
        <div className="flex flex-col border-t border-slate-100 pt-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={ALLOWED_TYPES.join(',')}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3.5 w-full px-3 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors rounded-xl text-left text-slate-700"
          >
            <ImageIcon className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium">Tải lên từ thiết bị</span>
          </button>

          {profile.avatarAvailable && (
            <button
              onClick={() => deleteMutation.mutate()}
              className="flex items-center gap-3.5 w-full px-3 py-3 hover:bg-rose-50 active:bg-rose-100 transition-colors rounded-xl text-left text-rose-600"
            >
              <TrashIcon className="w-5 h-5 text-rose-500" />
              <span className="text-sm font-medium">Xóa ảnh hiện tại</span>
            </button>
          )}
        </div>

        {/* Loading Overlay */}
        {isBusy && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <Spinner className="text-indigo-600 w-8 h-8" />
              <span className="text-xs font-medium text-slate-500">Đang xử lý...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ProfileInfoCard ────────────────────────────────────────────────────
export function ProfileInfoCard({ profile }: { profile: User }) {
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const closeAvatarModal = useCallback(() => setAvatarModalOpen(false), [])

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
      // PUT /profile không chắc trả kèm thông tin avatar. Nếu ghi đè thẳng thì avatar
      // sẽ biến mất khỏi header + sidebar ngay sau khi lưu, nên giữ lại giá trị cũ
      // cho những field mà response không nhắc tới. Phản ánh ngay + cập nhật header.
      queryClient.setQueryData<User>(['auth', 'me'], (oldUser) => {
        if (!updated) return oldUser
        return {
          ...updated,
          avatarAvailable: updated.avatarAvailable ?? oldUser?.avatarAvailable,
          avatarUrl: updated.avatarUrl ?? oldUser?.avatarUrl ?? null,
          avatarMimeType: updated.avatarMimeType ?? oldUser?.avatarMimeType ?? null,
        }
      })
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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-6">
      
      {/* Top Profile Header with Centered Avatar click-to-edit & Metadata below */}
      <div className="flex flex-col items-center pb-6 border-b border-slate-100">
        <div 
          onClick={() => setAvatarModalOpen(true)}
          className="relative group cursor-pointer rounded-full p-[3px] transition-transform duration-300 hover:scale-105 shrink-0"
          style={{
            background: 'conic-gradient(#ea4335 0% 25%, #4285f4 25% 50%, #34a853 50% 75%, #fbbc05 75% 100%)'
          }}
          title="Thay đổi ảnh đại diện"
        >
          <div className="bg-white rounded-full p-[2px]">
            <UserAvatar user={profile} size="xl" />
          </div>
          {/* Camera icon in a white circle at bottom-right */}
          <div className="absolute bottom-1 right-1 bg-white rounded-full p-1.5 shadow-md border border-slate-200 text-blue-600 transition-transform duration-200 group-hover:scale-110">
            <CameraIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="text-center mt-4 w-full">
          <h3 className="text-lg font-bold text-slate-800">
            {profile.studentCode ? `${profile.studentCode} - ` : ''}{profile.fullName}
          </h3>
          <p className="text-sm text-slate-500 mt-1">{profile.email}</p>
          <span className="inline-block mt-2.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">
            {profile.role === 'ADMIN' ? 'Super Admin' : profile.role === 'TEACHER' ? 'Giảng viên' : 'Sinh viên'}
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">Thông tin cá nhân</h2>
        <p className="mt-0.5 text-xs text-slate-500">Cập nhật họ tên, ngày sinh và số điện thoại.</p>
      </div>

      {apiError && (
        <Alert variant="error">
          {apiError}
        </Alert>
      )}
      {saved && (
        <Alert variant="success">
          Cập nhật thông tin thành công.
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
            Lưu thay đổi
          </Button>
        </div>
      </form>

      {/* Avatar Management Modal Popup */}
      {avatarModalOpen && (
        <AvatarModal profile={profile} onClose={closeAvatarModal} />
      )}
    </section>
  )
}
