import { Alert, Button, FormField, Input } from '@/components/ui'

function App() {
  return (
    <main className="flex min-h-screen items-start justify-center bg-slate-50 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">UI Primitives</h1>
          <p className="mt-1 text-sm text-slate-500">
            Showcase tạm để kiểm tra bộ component dùng chung (sẽ thay bằng routing thật).
          </p>
        </div>

        <FormField label="Email sinh viên" htmlFor="demo-email" required>
          <Input id="demo-email" placeholder="20A1234@student.edu.vn" defaultValue="20A1234@student.edu.vn" />
        </FormField>

        <FormField
          label="Mã số sinh viên"
          htmlFor="demo-msv"
          hint="MSV không thể sửa sau khi đăng ký"
        >
          <Input id="demo-msv" defaultValue="20A1234" disabled />
        </FormField>

        <FormField label="Mật khẩu" htmlFor="demo-pw" required error="Mật khẩu phải có ít nhất 8 ký tự">
          <Input id="demo-pw" type="password" invalid defaultValue="123" />
        </FormField>

        <Alert variant="error">Email hoặc mật khẩu không đúng.</Alert>
        <Alert variant="success">Đăng ký thành công!</Alert>

        <div className="flex gap-3">
          <Button variant="primary" fullWidth>
            Đăng nhập
          </Button>
          <Button variant="secondary">Hủy</Button>
        </div>
        <Button variant="primary" fullWidth loading>
          Đang xử lý
        </Button>
      </div>
    </main>
  )
}

export default App
