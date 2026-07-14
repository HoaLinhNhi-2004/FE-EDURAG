import { useState } from 'react'
import { BrandMark, Button } from '@/components/ui'
import { useAuth } from '@/store/auth'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { ChatPage } from '@/features/chat/pages/ChatPage'

type AuthView = 'login' | 'register' | 'forgot' | 'reset'

/**
 * App root TẠM: điều phối theo trạng thái đăng nhập để màn Client chạy độc lập
 * khi chưa có routing thật. Sẽ được thay bằng router + ProtectedRoute (task 1.3, LN Long).
 */
function App() {
  const { status, isAuthenticated, user, logout } = useAuth()
  const [view, setView] = useState<AuthView>('login')

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Đang tải…</div>
  }

  if (!isAuthenticated) {
    switch (view) {
      case 'register':
        return <RegisterPage onGoLogin={() => setView('login')} />
      case 'forgot':
        return (
          <ForgotPasswordPage onGoLogin={() => setView('login')} onGoReset={() => setView('reset')} />
        )
      case 'reset':
        return <ResetPasswordPage onGoLogin={() => setView('login')} />
      default:
        return (
          <LoginPage onGoRegister={() => setView('register')} onGoForgot={() => setView('forgot')} />
        )
    }
  }

  // Khung TẠM chờ ClientLayout + routing (task 1.3/1.4 của LN Long).
  // Chỉ dựng phần Chat (UC 7); chưa có sidebar điều hướng / panel Nguồn / Lịch sử.
  return (
    <div className="flex h-screen flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="font-semibold text-slate-900">EduRAG</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{user?.fullName}</span>
          <Button variant="secondary" onClick={logout}>
            Đăng xuất
          </Button>
        </div>
      </header>
      <ChatPage />
    </div>
  )
}

export default App
