import { useState } from 'react'
import { BrandMark, Button } from '@/components/ui'
import { useAuth } from '@/store/auth'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { ChatPage } from '@/features/chat/pages/ChatPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { cn } from '@/utils/cn'

type AuthView = 'login' | 'register' | 'forgot' | 'reset'
type AppView = 'chat' | 'profile'

/**
 * App root TẠM: điều phối theo trạng thái đăng nhập để màn Client chạy độc lập
 * khi chưa có routing thật. Sẽ được thay bằng router + ProtectedRoute (task 1.3, LN Long).
 */
function App() {
  const { status, isAuthenticated, user, logout } = useAuth()
  const [view, setView] = useState<AuthView>('login')
  const [appView, setAppView] = useState<AppView>('chat')

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
  // Nav Chat/Hồ sơ tạm ở header; chưa có sidebar / panel Nguồn / Lịch sử.
  const navItem = (v: AppView, label: string) => (
    <button
      type="button"
      onClick={() => setAppView(v)}
      className={cn(
        'rounded-lg px-3 py-1.5 text-sm font-medium',
        appView === v ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100',
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="flex h-screen flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="font-semibold text-slate-900">EduRAG</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItem('chat', 'Hỏi đáp AI')}
            {navItem('profile', 'Hồ sơ')}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{user?.fullName}</span>
          <Button variant="secondary" onClick={logout}>
            Đăng xuất
          </Button>
        </div>
      </header>
      {appView === 'chat' ? <ChatPage /> : <ProfilePage />}
    </div>
  )
}

export default App
