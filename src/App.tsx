import { useState } from 'react'
import { Button } from '@/components/ui'
import { useAuth } from '@/store/auth'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-500">Đăng nhập thành công (placeholder chờ routing)</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">{user?.fullName}</h1>
        <p className="text-sm text-slate-600">
          {user?.email} · {user?.role}
        </p>
        <Button variant="secondary" className="mt-4" onClick={logout}>
          Đăng xuất
        </Button>
      </div>
    </main>
  )
}

export default App
