/*
  ProtectedRoute
  - Purpose: Bảo vệ route theo phiên đăng nhập và role.
  - Behavior:
    - Nếu `status === 'loading'` hiển thị loading placeholder.
    - Nếu chưa đăng nhập => redirect về `/login` (giữ `from` trong state).
    - Nếu đã đăng nhập nhưng user không có role phù hợp => redirect về `/`.
  - Usage: Bao một cây element bằng <ProtectedRoute allowedRoles={[...]}>
    - `allowedRoles` lấy `Role[]` theo kiểu trong `src/types/auth.ts`.
*/
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import type { Role } from '@/types'

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode
  allowedRoles?: Role[]
}) {
  const { isAuthenticated, status, hasRole } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Đang kiểm tra phiên…</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute