/*
AuthLayout
  - Purpose: Layout dùng cho các trang xác thực (login/register/forgot/reset).
  - Behavior: căn giữa form, giới hạn chiều rộng (`max-w-md`) để form nhìn gọn.
  - Usage: Wrap form pages: <AuthLayout><LoginPage/></AuthLayout>
*/
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  )
}
