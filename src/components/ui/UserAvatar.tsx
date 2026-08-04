import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { profileApi } from '@/api/profile.api'
import { useAuth } from '@/store/auth'
import type { User } from '@/types'
import { Spinner } from './Spinner'

interface UserAvatarProps {
  user: User | null
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Avatar tròn cho một user bất kỳ.
 *
 * LƯU Ý: BE chỉ có endpoint `GET /profile/avatar` trả ảnh của **chính người đang
 * đăng nhập**, chưa có endpoint lấy ảnh theo id. Vì vậy component chỉ tải ảnh khi
 * `user` đúng là người đang đăng nhập; với user khác (vd bảng quản lý người dùng)
 * nó hiển thị chữ cái đầu, tránh hiện nhầm ảnh của admin cho mọi dòng.
 */
export function UserAvatar({ user, className = '', size = 'md' }: UserAvatarProps) {
  const { user: currentUser } = useAuth()
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  }

  const initials = useMemo(() => {
    if (!user?.fullName) return '?'
    const parts = user.fullName.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }, [user?.fullName])

  // Màu nền chữ cái đầu theo vai trò: TEACHER teal, còn lại indigo (giữ nguyên
  // màu vốn có của sidebar Client cho STUDENT).
  const avatarColor = useMemo(
    () => (user?.role === 'TEACHER' ? 'bg-teal-600' : 'bg-indigo-600'),
    [user?.role],
  )

  // Chỉ tải ảnh khi đây đúng là người đang đăng nhập (xem chú thích ở đầu file).
  const canLoadAvatar = !!user?.avatarAvailable && !!currentUser && user.id === currentUser.id

  const { data: blob, isPending, isError } = useQuery({
    queryKey: ['auth', 'me', 'avatar'],
    queryFn: profileApi.getAvatarBlob,
    enabled: canLoadAvatar,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })

  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) {
      setObjectUrl(null)
      return
    }
    const url = URL.createObjectURL(blob)
    setObjectUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [blob])

  const baseStyle = 'relative flex-shrink-0 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden border border-slate-100 shadow-inner select-none transition-transform hover:scale-[1.02]'

  if (canLoadAvatar && isPending) {
    return (
      <div className={`${baseStyle} ${sizeClasses[size]} bg-slate-100 ${className}`}>
        <Spinner className="text-slate-400 w-4 h-4" />
      </div>
    )
  }

  if (canLoadAvatar && objectUrl && !isError) {
    return (
      <div className={`${baseStyle} ${sizeClasses[size]} ${className}`}>
        <img
          src={objectUrl}
          alt={`Ảnh đại diện của ${user?.fullName ?? 'người dùng'}`}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    )
  }

  // Fallback to initials
  return (
    <div className={`${baseStyle} ${sizeClasses[size]} ${avatarColor} ${className}`}>
      {initials}
    </div>
  )
}
