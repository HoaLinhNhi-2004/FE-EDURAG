import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

/**
 * ErrorBoundary toàn cục (C1): bắt lỗi render/lifecycle trong cây React và hiển thị
 * fallback thay vì để trắng trang. Không bắt lỗi async/API — phần đó do từng màn xử lý
 * qua trạng thái error của TanStack Query (loading/error/empty).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Ghi log để debug; sau này có thể gắn dịch vụ báo lỗi (Sentry...) tại đây.
    console.error('ErrorBoundary bắt lỗi render:', error, info.componentStack)
  }

  private handleReload = () => {
    this.setState({ hasError: false })
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-500">
          !
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Đã xảy ra lỗi ngoài ý muốn</h1>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Giao diện gặp sự cố khi hiển thị. Vui lòng tải lại trang để tiếp tục.
          </p>
        </div>
        <button
          type="button"
          onClick={this.handleReload}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Tải lại trang
        </button>
      </div>
    )
  }
}
