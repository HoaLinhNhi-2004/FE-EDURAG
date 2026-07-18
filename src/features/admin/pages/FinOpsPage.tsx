import { useState } from 'react'

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconZap({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
}
function IconCpu({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
}
function IconDollar({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
}
function IconWallet({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><path d="M20 12h-4a2 2 0 0 0 0 4h4"/></svg>
}
function IconSettings({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
}
function IconEdit({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M18 6 6 18M6 6l12 12"/></svg>
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

// ─── Main page ────────────────────────────────────────────────────────────────
export function FinOpsPage() {
  const [period, setPeriod] = useState<Period>('month')
  const [showEditBudget, setShowEditBudget] = useState(false)
  const [budget, setBudget] = useState<BudgetConfig>({
    limit: 7,
    warnAt: 80,
    hardLimit: 100,
    action: 'Khóa API',
  })

  // Token stats theo period
  const STATS: Record<Period, { prompt: string; completion: string; cost: string; label: string }> = {
    day:   { prompt: '13K',   completion: '4K',    cost: '$0.18', label: 'Hôm nay' },
    month: { prompt: '394K',  completion: '111K',  cost: '$4.98', label: 'Tháng 7/2026' },
    year:  { prompt: '3.2M',  completion: '890K',  cost: '$39.2', label: 'Năm 2026' },
  }

  const stat = STATS[period]
  const usedAmount = 4.98
  const usedPct = Math.round((usedAmount / budget.limit) * 100)
  const remaining = (budget.limit - usedAmount).toFixed(2)
  const remainingPct = 100 - usedPct

  // Bar color based on percent
  const barColor =
    usedPct >= budget.hardLimit ? 'bg-red-500' :
    usedPct >= budget.warnAt   ? 'bg-amber-400' :
    'bg-indigo-500'

  const remainColor =
    usedPct >= budget.warnAt ? 'text-amber-500' : 'text-emerald-600'

  const PERIODS: { id: Period; label: string }[] = [
    { id: 'day',   label: 'Ngày' },
    { id: 'month', label: 'Tháng' },
    { id: 'year',  label: 'Năm' },
  ]

  return (
    <div className="flex flex-col min-h-full bg-slate-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">FinOps & Quản lý Token LLM</h1>
          <p className="text-sm text-slate-500 mt-1">Thống kê token tiêu thụ và quản lý ngân sách API</p>
        </div>
        {/* Period selector */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                period === p.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Prompt tokens */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
            <IconZap className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-[22px] font-bold text-slate-900">{stat.prompt}</p>
          <p className="text-xs text-slate-500 mt-0.5">Tổng Prompt Tokens</p>
          <p className="text-xs text-indigo-500 font-semibold mt-1.5">{stat.label}</p>
        </div>
        {/* Completion tokens */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
            <IconCpu className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-[22px] font-bold text-slate-900">{stat.completion}</p>
          <p className="text-xs text-slate-500 mt-0.5">Tổng Completion Tokens</p>
          <p className="text-xs text-indigo-500 font-semibold mt-1.5">{stat.label}</p>
        </div>
        {/* Chi phí thực tế */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
            <IconDollar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[22px] font-bold text-slate-900">{stat.cost}</p>
          <p className="text-xs text-slate-500 mt-0.5">Chi phí thực tế</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1.5">{stat.label}</p>
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

      {/* Budget card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {/* Card header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-slate-800">Ngân sách tháng 7/2026</h2>
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
        <p className="text-xs text-slate-400 mb-4">Giới hạn: ${budget.limit.toFixed(2)} • Đã dùng: ${usedAmount.toFixed(2)}</p>

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
  )
}
