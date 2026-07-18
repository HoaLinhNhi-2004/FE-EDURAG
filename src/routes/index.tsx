/*
  Routes index
  - Purpose: Central route config using `react-router-dom`.
  - Conventions followed:
    - Lazy-load page components with `React.lazy` + `Suspense`.
    - Role mapping per `src/types/auth.ts`: 'STUDENT' -> /student, 'TEACHER'|'ADMIN' -> /dashboard.
    - Protected routes wrap content with <ProtectedRoute allowedRoles={[...]} />.
  - To add a new protected route: create page, lazy-import it, then add a route with `ProtectedRoute` and proper `allowedRoles`.
*/
import { Suspense, lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { Role } from '@/types'
import ProtectedRoute from './ProtectedRoute'
import AuthLayout from '@/layouts/AuthLayout'
import ClientLayout from '@/layouts/ClientLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import { useAuth } from '@/store/auth'

// Lazy-load named exports from feature pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(
  () => import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const ChatPage = lazy(() => import('@/features/chat/pages/ChatPage').then((m) => ({ default: m.ChatPage })))
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const HistoryPage = lazy(() => import('@/features/chat/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })))

// Placeholder cho khu vực Giảng viên/Admin (LN Long)
function DashboardHome() {
  return <div>Chào mừng vào Bảng điều khiển (GV / Admin)</div>
}

function RoleRedirector() {
  const { status, isAuthenticated, user } = useAuth()
  if (status === 'loading') return <div>Đang tải…</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Điều hướng theo role (theo kiểu `Role` trong src/types/auth.ts)
  if (user?.role === 'STUDENT') return <Navigate to="/student" replace />
  return <Navigate to="/dashboard" replace />
}

export const router = createBrowserRouter([
  // Public auth routes
  {
    path: '/login',
    element: (
      <Suspense fallback={<div>Đang tải…</div>}>
        <AuthLayout>
          <LoginPage />
        </AuthLayout>
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<div>Đang tải…</div>}>
        <AuthLayout>
          <RegisterPage />
        </AuthLayout>
      </Suspense>
    ),
  },
  {
    path: '/forgot',
    element: (
      <Suspense fallback={<div>Đang tải…</div>}>
        <AuthLayout>
          <ForgotPasswordPage />
        </AuthLayout>
      </Suspense>
    ),
  },
  {
    path: '/reset',
    element: (
      <Suspense fallback={<div>Đang tải…</div>}>
        <AuthLayout>
          <ResetPasswordPage />
        </AuthLayout>
      </Suspense>
    ),
  },

  // Root redirects authenticated users to role-appropriate area
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RoleRedirector />
      </ProtectedRoute>
    ),
  },

  // Student area (ClientLayout) — Hỏi đáp AI (UC 7, 11)
  {
    path: '/student',
    element: (
      <ProtectedRoute allowedRoles={['STUDENT'] as Role[]}>
        <ClientLayout>
          <Suspense fallback={<div className="p-6 text-slate-500">Đang tải…</div>}>
            <ChatPage />
          </Suspense>
        </ClientLayout>
      </ProtectedRoute>
    ),
  },

  // Lịch sử trò chuyện (UC 9)
  {
    path: '/student/history',
    element: (
      <ProtectedRoute allowedRoles={['STUDENT'] as Role[]}>
        <ClientLayout>
          <Suspense fallback={<div className="p-6 text-slate-500">Đang tải…</div>}>
            <HistoryPage />
          </Suspense>
        </ClientLayout>
      </ProtectedRoute>
    ),
  },

  // Hồ sơ cá nhân sinh viên (UC 4, 5, 6)
  {
    path: '/student/profile',
    element: (
      <ProtectedRoute allowedRoles={['STUDENT'] as Role[]}>
        <ClientLayout>
          <Suspense fallback={<div className="p-6 text-slate-500">Đang tải…</div>}>
            <ProfilePage />
          </Suspense>
        </ClientLayout>
      </ProtectedRoute>
    ),
  },

  // Dashboard for Lecturer & Admin
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN'] as Role[]}>
        <DashboardLayout>
          <DashboardHome />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
])
