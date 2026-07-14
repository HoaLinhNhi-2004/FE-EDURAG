import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Role, User } from '@/types'
import { profileApi } from '@/api/profile.api'
import { getAccessToken, setAccessToken, clearAccessToken } from '@/utils/token'

/**
 * Nguồn sự thật duy nhất về phiên đăng nhập cho toàn app.
 * - Khôi phục session khi tải lại trang: nếu còn token → gọi /auth/me lấy user.
 * - login()/logout() được các màn Đăng nhập / nút Đăng xuất gọi.
 * - hasRole() cho ProtectedRoute (task 1.3 của LN Long) kiểm tra quyền.
 *
 * User được cache qua TanStack Query (đúng quy ước "server state dùng Query"),
 * còn Context chỉ phơi ra dạng đã suy diễn cho tiện dùng.
 */

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const ME_QUERY_KEY = ['auth', 'me'] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [hasToken, setHasToken] = useState(() => Boolean(getAccessToken()))

  // Chỉ gọi /auth/me khi có token. 401 (token hết hạn) đã được interceptor
  // trong api/client.ts xử lý: xóa token + điều hướng /login.
  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: profileApi.me,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const login = useCallback(
    (token: string, user: User) => {
      setAccessToken(token)
      queryClient.setQueryData(ME_QUERY_KEY, user)
      setHasToken(true)
    },
    [queryClient],
  )

  const logout = useCallback(() => {
    clearAccessToken()
    setHasToken(false)
    queryClient.removeQueries() // dọn cache dữ liệu của người dùng cũ
  }, [queryClient])

  const user = hasToken ? meQuery.data ?? null : null

  let status: AuthStatus
  if (!hasToken) status = 'unauthenticated'
  else if (meQuery.isPending) status = 'loading'
  else if (meQuery.isError) status = 'unauthenticated'
  else status = 'authenticated'

  const hasRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      login,
      logout,
      hasRole,
    }),
    [user, status, login, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>')
  }
  return ctx
}
