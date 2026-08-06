import { useState, useEffect } from 'react'
import { getAccessToken } from '@/utils/token'
import { PageHeader } from '@/components/ui'

const API = import.meta.env.VITE_API_BASE_URL

// Shape từ BE: GET /api/admin/dashboard/summary
interface UsageTotals {
  calls: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

interface UsageBreakdown {
  provider: string
  model: string
  status: string
  currency: string
  calls: number
  totalTokens: number
  estimatedCost: number | string | null
}

interface DashboardSummary {
  range: { from: string | null; to: string | null }
  documents: Array<{ processing_status: string; visibility_status: string; total: number }>
  chat: { sessions: number; messages: number; citations: number }
  usage: {
    scope: string
    totals: UsageTotals
    breakdown: UsageBreakdown[]
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconZap({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
}
function IconCpu({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg>
}
function IconDollar({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
}
function IconWallet({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" /><path d="M20 12h-4a2 2 0 0 0 0 4h4" /></svg>
}
function IconSettings({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
}
function IconEdit({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
}
function IconLayers({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
}
function IconMessageSquare({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Period = 'day' | 'month' | 'year'

interface BudgetConfig {
  limit: number      // USD
  warnAt: number     // %
  hardLimit: number  // %
  action: string
}

// ─── Edit budget modal ────────────────────────────────────────────────────────
interface EditBudgetModalProps {
  config: BudgetConfig
  onClose: () => void
  onSave: (next: BudgetConfig) => void
}

function EditBudgetModal({ config, onClose, onSave }: EditBudgetModalProps) {
  const [form, setForm] = useState({ ...config })

  const set = (key: keyof BudgetConfig, val: string | number) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-slate-900">Cấu hình ngân sách</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Giới hạn ngân sách (USD/tháng)</label>
            <input
              type="number" min={1} step={0.5}
              value={form.limit}
              onChange={e => set('limit', parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cảnh báo tại (%)</label>
            <input
              type="number" min={1} max={99}
              value={form.warnAt}
              onChange={e => set('warnAt', parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Giới hạn cứng (%)</label>
            <input
              type="number" min={1} max={100}
              value={form.hardLimit}
              onChange={e => set('hardLimit', parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Hành động khi vượt</label>
            <select
              value={form.action}
              onChange={e => set('action', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="Khóa API">Khóa API</option>
              <option value="Gửi cảnh báo">Gửi cảnh báo</option>
              <option value="Hạ model">Hạ model</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Hủy</button>
          <button onClick={() => { onSave(form); onClose() }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">Lưu</button>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
function fmtCost(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '$0.00'
  return '$' + n.toFixed(4)
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function FinOpsPage() {
  const [period, setPeriod] = useState<Period>('month')
  const [showEditBudget, setShowEditBudget] = useState(false)
  const [budget, setBudget] = useState<BudgetConfig>({
    limit: 10,
    warnAt: 80,
    hardLimit: 100,
    action: 'Khóa API',
  })

  // ── Fetch từ BE thật: GET /api/admin/dashboard/summary ──────────────────────
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  useEffect(() => {
    const tok = getAccessToken()
    setLoadingSummary(true)
    setSummaryError(null)

    const now = new Date()
    let fromDate: Date | null = null
    if (period === 'day') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === 'month') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (period === 'year') {
      fromDate = new Date(now.getFullYear(), 0, 1)
    }

    const query = fromDate ? `?from=${encodeURIComponent(fromDate.toISOString())}` : ''

    fetch(`${API}/admin/dashboard/summary${query}`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setSummary(j.data as DashboardSummary)
        else setSummaryError(j.message ?? 'Không tải được thống kê.')
      })
      .catch(() => setSummaryError('Lỗi kết nối. Không tải được thống kê.'))
      .finally(() => setLoadingSummary(false))
  }, [period])

  // Lấy số liệu từ BE
  const totals = summary?.usage?.totals
  const breakdown = summary?.usage?.breakdown ?? []
  const chatStats = summary?.chat

  const periodLabel = period === 'day' ? 'Hôm nay' : period === 'month' ? 'Tháng này' : 'Năm nay'

  // Tổng chi phí ước tính từ breakdown
  const estimatedCost = breakdown.reduce(
    (sum, r) => sum + Number(r.estimatedCost ?? 0),
    0
  )

  const usedAmount = estimatedCost
  const usedPct = budget.limit > 0 ? Math.min(100, Math.round((usedAmount / budget.limit) * 100)) : 0
  const remaining = Math.max(0, budget.limit - usedAmount).toFixed(2)
  const remainingPct = 100 - usedPct

  const barColor =
    usedPct >= budget.hardLimit ? 'bg-red-500' :
      usedPct >= budget.warnAt ? 'bg-amber-400' :
        'bg-indigo-500'

  const remainColor = usedPct >= budget.warnAt ? 'text-amber-500' : 'text-emerald-600'

  const PERIODS: { id: Period; label: string }[] = [
    { id: 'day', label: 'Ngày' },
    { id: 'month', label: 'Tháng' },
    { id: 'year', label: 'Năm' },
  ]

  const currentMonthYear = `tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden bg-slate-50">
      <PageHeader
        title="FinOps & Quản lý Token LLM"
        subtitle="Thống kê tiêu thụ Token, phân tích chi phí LLM và quản lý ngân sách hệ thống"
        actions={
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 overflow-hidden">
            {PERIODS.map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  period === p.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">

      {summaryError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {summaryError}
        </div>
      )}

      {/* Stat cards — khớp chính xác với BE totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Prompt tokens */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
            <IconZap className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-[22px] font-bold text-slate-900">
            {loadingSummary ? '...' : fmtTokens(totals?.promptTokens ?? 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Tổng Prompt Tokens</p>
          <p className="text-xs text-indigo-500 font-semibold mt-1.5">{periodLabel}</p>
        </div>

        {/* Completion tokens */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
            <IconCpu className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-[22px] font-bold text-slate-900">
            {loadingSummary ? '...' : fmtTokens(totals?.completionTokens ?? 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Tổng Completion Tokens</p>
          <p className="text-xs text-indigo-500 font-semibold mt-1.5">{periodLabel}</p>
        </div>

        {/* Chi phí thực tế */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
            <IconDollar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[22px] font-bold text-slate-900">
            {loadingSummary ? '...' : fmtCost(estimatedCost)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Chi phí ước tính</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1.5">{totals?.calls ?? 0} LLM calls</p>
        </div>

        {/* Ngân sách còn lại */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <IconWallet className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-[22px] font-bold text-slate-900">${remaining}</p>
          <p className="text-xs text-slate-500 mt-0.5">Ngân sách còn lại</p>
          <p className={`text-xs font-semibold mt-1.5 ${remainColor}`}>Còn {remainingPct}%</p>
        </div>
      </div>

      {/* Overview từ BE (System metrics & LLM Scope) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <IconMessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Phiên trò chuyện (Chat Sessions)</p>
            <p className="text-lg font-bold text-slate-800">{loadingSummary ? '...' : chatStats?.sessions ?? 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <IconZap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tin nhắn được xử lý (Messages)</p>
            <p className="text-lg font-bold text-slate-800">{loadingSummary ? '...' : chatStats?.messages ?? 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <IconLayers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Nguồn trích dẫn (Citations)</p>
            <p className="text-lg font-bold text-slate-800">{loadingSummary ? '...' : chatStats?.citations ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Chi tiết tiêu thụ theo Provider / Model (breakdown từ BE) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Chi tiết tiêu thụ theo Model (LLM Breakdown)</h2>
            <p className="text-xs text-slate-400 mt-0.5">Dữ liệu trực tiếp từ endpoint GET /api/admin/dashboard/summary</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
            Scope: {summary?.usage?.scope ?? 'LLM_CALLS_ONLY'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Nhà cung cấp (Provider)</th>
                <th className="px-6 py-3">Model</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3 text-right">Số cuộc gọi</th>
                <th className="px-6 py-3 text-right">Tổng Tokens</th>
                <th className="px-6 py-3 text-right">Chi phí ước tính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingSummary ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Đang tải dữ liệu tiêu thụ LLM...
                  </td>
                </tr>
              ) : breakdown.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Chưa có cuộc gọi LLM nào trong khoảng thời gian này.
                  </td>
                </tr>
              ) : (
                breakdown.map((row, idx) => (
                  <tr key={`${row.provider}-${row.model}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 capitalize">
                      {row.provider}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-mono font-medium">
                        {row.model}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        row.status === 'SUCCEEDED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {row.calls.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700">
                      {row.totalTokens.toLocaleString()} ({fmtTokens(row.totalTokens)})
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                      {fmtCost(Number(row.estimatedCost ?? 0))} <span className="text-[10px] text-slate-400">{row.currency}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {/* Card header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-slate-800">Ngân sách {currentMonthYear}</h2>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${usedPct >= budget.warnAt ? 'text-amber-500' : 'text-indigo-600'}`}>
              {usedPct}%
            </span>
            <button
              onClick={() => setShowEditBudget(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <IconSettings className="w-3.5 h-3.5" />
              Cấu hình
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-4">Giới hạn: ${budget.limit.toFixed(2)} • Đã dùng: ${usedAmount.toFixed(4)}</p>

        {/* Progress bar */}
        <div className="relative mb-1">
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${Math.min(usedPct, 100)}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 mb-6">
          <span>$0</span>
          <span className="text-slate-500 font-medium">Trong ngưỡng an toàn</span>
          <span>${budget.limit.toFixed(2)}</span>
        </div>

        {/* Config row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Cảnh báo tại */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1">CẢNH BÁO TẠI</p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-bold text-slate-800">{budget.warnAt}%</p>
              <button onClick={() => setShowEditBudget(true)} className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors mb-0.5">Chỉnh sửa</button>
            </div>
          </div>
          {/* Giới hạn cứng */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1">GIỚI HẠN CỨNG</p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-bold text-slate-800">{budget.hardLimit}%</p>
              <button onClick={() => setShowEditBudget(true)} className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors mb-0.5">Chỉnh sửa</button>
            </div>
          </div>
          {/* Hành động */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1">HÀNH ĐỘNG KHI VƯỢT</p>
            <div className="flex items-end justify-between">
              <p className="text-base font-bold text-slate-800">{budget.action}</p>
              <button onClick={() => setShowEditBudget(true)} className="text-slate-300 hover:text-indigo-500 transition-colors mb-0.5">
                <IconEdit className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit budget modal */}
      {showEditBudget && (
        <EditBudgetModal
          config={budget}
          onClose={() => setShowEditBudget(false)}
          onSave={next => setBudget(next)}
        />
      )}
      </div>
    </div>
  )
}
