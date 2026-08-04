import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/store/auth'
import { profileApi } from '@/api/profile.api'
import { Alert, Button, UserAvatar } from '@/components/ui'
import type { ApiError, User } from '@/types'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function AvatarUploadCard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const uploadMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: (avatarData) => {
      setErrorMsg(null)
      // Cập nhật thông tin avatar trong cache profile hiện tại, giữ lại thông tin cũ
      queryClient.setQueryData<User>(['auth', 'me'], (oldUser) => {
        if (!oldUser) return oldUser
        return {
          ...oldUser,
          avatarAvailable: avatarData?.avatarAvailable ?? false,
          avatarUrl: avatarData?.avatarUrl ?? null,
          avatarMimeType: avatarData?.avatarMimeType ?? null,
        }
      })
      // Invalidate query lấy avatar blob để tải lại hình mới
      queryClient.invalidateQueries({ queryKey: ['auth', 'me', 'avatar'] })
    },
    onError: (error: ApiError) => {
      setErrorMsg(error.message || 'Tải ảnh đại diện thất bại.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: profileApi.deleteAvatar,
    onSuccess: (avatarData) => {
      setErrorMsg(null)
      // Cập nhật thông tin avatar trong cache profile hiện tại, giữ lại thông tin cũ
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
    },
    onError: (error: ApiError) => {
      setErrorMsg(error.message || 'Xóa ảnh đại diện thất bại.')
    },
  })

  const validateAndUpload = (file: File) => {
    setErrorMsg(null)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg('Định dạng tệp không được hỗ trợ. Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.')
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg('Kích thước ảnh đại diện không được vượt quá 5MB.')
      return
    }
    uploadMutation.mutate(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndUpload(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndUpload(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Ảnh đại diện</h2>
      <p className="mt-1 text-sm text-slate-500">
        Cá nhân hóa tài khoản của bạn. Hỗ trợ định dạng JPEG, PNG, WebP tối đa 5MB.
      </p>

      {errorMsg && (
        <Alert variant="error" className="mt-4">
          {errorMsg}
        </Alert>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-6">
        {/* Avatar Preview Area */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`relative group cursor-pointer rounded-full p-1 transition-all duration-300 ${
            dragActive
              ? 'ring-4 ring-indigo-500 ring-offset-2 scale-105'
              : 'hover:ring-4 hover:ring-slate-100 hover:ring-offset-1'
          }`}
        >
          <UserAvatar user={user} size="xl" />
          <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-[11px] font-medium text-white px-2 py-1 bg-black/40 rounded-full backdrop-blur-sm">
              Thay đổi
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex-1 flex flex-col gap-3 items-center sm:items-start">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={ALLOWED_TYPES.join(',')}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={triggerFileInput}
              loading={uploadMutation.isPending}
              variant="primary"
            >
              Tải ảnh lên
            </Button>

            {user?.avatarAvailable && (
              <Button
                type="button"
                onClick={() => deleteMutation.mutate()}
                loading={deleteMutation.isPending}
                variant="secondary"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 hover:border-rose-300"
              >
                Xóa ảnh
              </Button>
            )}
          </div>

          <p className="text-xs text-slate-400 text-center sm:text-left">
            Kéo thả ảnh vào hình tròn hoặc nhấn vào nút ở trên để tải lên.
          </p>
        </div>
      </div>
    </section>
  )
}
