import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { profileApi } from '@/api/profile.api'
import type { User } from '@/types'
import { Spinner } from './Spinner'

interface UserAvatarProps {
  user: User | null
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function UserAvatar({ user, className = '', size = 'md' }: UserAvatarProps) {
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

  const avatarColor = useMemo(() => {
    if (user?.role === 'ADMIN') return 'bg-indigo-600'
    return 'bg-teal-600'
  }, [user?.role])

  // Lấy avatar blob từ BE nếu user đã cấu hình avatar.
  // Query key phụ thuộc cả vào avatarAvailable để trigger fetch lại khi có sự thay đổi.
  const { data: blob, isPending, isError } = useQuery({
    queryKey: ['auth', 'me', 'avatar', user?.avatarAvailable],
    queryFn: profileApi.getAvatarBlob,
    enabled: !!user?.avatarAvailable,
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

  if (user?.avatarAvailable && isPending) {
    return (
      <div className={`${baseStyle} ${sizeClasses[size]} bg-slate-100 ${className}`}>
        <Spinner className="text-slate-400 w-4 h-4" />
      </div>
    )
  }

  if (user?.avatarAvailable && objectUrl && !isError) {
    return (
      <div className={`${baseStyle} ${sizeClasses[size]} ${className}`}>
        <img
          src={objectUrl}
          alt={user.fullName}
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
