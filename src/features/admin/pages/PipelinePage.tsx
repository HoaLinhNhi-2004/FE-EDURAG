import { useState, useCallback } from 'react'
import { getAccessToken } from '@/utils/token'

const API = import.meta.env.VITE_API_BASE_URL

function IconFile({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
}
function IconDatabase({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
}
function IconClock({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function IconAlertCircle({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
}
function IconRefresh({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
}
function IconRetry({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
}

type PipelineStatus = 'processing' | 'queued' | 'done' | 'error'

interface PipelineItem {
  id: number
  filename: string
  stage: string
  status: PipelineStatus
  progress: number
  timeAgo: string
}

const INITIAL_PIPELINE: PipelineItem[] = [
  { id: 1, filename: 'GiaoTrinh_CNTT_2026.pdf',  stage: 'Vector Indexing', status: 'processing', progress: 87, timeAgo: '2 phút trước' },
  { id: 2, filename: 'Slide_CNN_Tuan3.pptx',      stage: 'OCR / Parsing',   status: 'processing', progress: 45, timeAgo: '5 phút trước' },
  { id: 3, filename: 'BaiGiang_NLP_Tuan6.pdf',    stage: 'Chunking',        status: 'done',       progress: 100, timeAgo: '12 phút trước' },
  { id: 4, filename: 'GiaoTrinh_Old_2019.pdf',    stage: 'OCR / Parsing',   status: 'error',      progress: -1,  timeAgo: '8 phút trước' },
  { id: 5, filename: 'Slide_ML_Chuong1.pdf',      stage: 'Chờ xử lý',      status: 'queued',     progress: -1,  timeAgo: 'Vừa upload' },
]

const STATUS_CFG: Record<PipelineStatus, { dot: string; bar: string }> = {
  processing: { dot: 'bg-indigo-500',  bar: 'bg-indigo-500' },
  done:       { dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  error:      { dot: 'bg-red-500',     bar: 'bg-red-500' },
  queued:     { dot: 'bg-slate-300',   bar: 'bg-slate-200' },
}

export function PipelinePage() {
  const [pipeline, setPipeline] = useState<PipelineItem[]>(INITIAL_PIPELINE)
  const [docs, setDocs] = useState(1248)
  const [spinning, setSpinning] = useState(false)
  const [retryingId, setRetryingId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setSpinning(true)
    try {
      const tok = getAccessToken()
      await fetch(`${API}/admin/pipeline`, { headers: { Authorization: `Bearer ${tok}` } })
    } catch { /* ignore */ }
    await new Promise(r => setTimeout(r, 700))
    setDocs(d => d + 12)
    setSpinning(false)
  }, [])

  const retryJob = async (id: number) => {
    setRetryingId(id)
    await new Promise(r => setTimeout(r, 800))
    setPipeline(prev => prev.map(p =>
      p.id === id ? { ...p, status: 'queued', stage: 'Chờ xử lý', timeAgo: 'Vừa thử lại' } : p
    ))
    setRetryingId(null)
  }

  const processingCount = pipeline.filter(p => p.status === 'processing').length
  const errorCount = pipeline.filter(p => p.status === 'error').length

  return (
    <div className="flex flex-col min-h-full bg-slate-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Giám sát Pipeline & Vector DB</h1>
          <p className="text-sm text-slate-500 mt-1">Theo dõi OCR, chunking, indexing và trạng thái Vector DB</p>
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm transition-colors">
          <IconRefresh className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
            <IconFile className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-[22px] font-bold text-slate-900">{docs.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-slate-500 mt-0.5">Tài liệu đã xử lý</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1.5">+12 hôm nay</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center mb-3">
            <IconDatabase className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-[22px] font-bold text-slate-900">84,231</p>
          <p className="text-xs text-slate-500 mt-0.5">Vectors trong DB</p>
          <p className="text-xs text-violet-500 font-semibold mt-1.5">Milvus v2.4</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <IconClock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-[22px] font-bold text-slate-900">3</p>
          <p className="text-xs text-slate-500 mt-0.5">Queue xử lý</p>
          <p className="text-xs text-amber-500 font-semibold mt-1.5">Đang chờ OCR</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center mb-3">
            <IconAlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-[22px] font-bold text-slate-900">{errorCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Lỗi Pipeline</p>
          <p className="text-xs text-red-500 font-semibold mt-1.5">{errorCount > 0 ? 'Cần xử lý' : 'Bình thường'}</p>
        </div>
      </div>

      {/* Pipeline list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Tiến trình Pipeline</h2>
          {processingCount > 0 && (
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
              {processingCount} đang chạy
            </span>
          )}
        </div>
        <div className="divide-y divide-slate-50">
          {pipeline.map(item => {
            const cfg = STATUS_CFG[item.status]
            const isRetrying = retryingId === item.id
            return (
              <div key={item.id} className="px-5 py-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className={`mt-[7px] flex-shrink-0 w-2 h-2 rounded-full ${cfg.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.filename}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.stage}</p>
                      {item.progress >= 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`} style={{ width: `${item.progress}%` }} />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400 w-8 text-right">{item.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-[11px] text-slate-400">{item.timeAgo}</span>
                    {item.status === 'error' && (
                      <button
                        onClick={() => retryJob(item.id)}
                        disabled={isRetrying}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors"
                      >
                        <IconRetry className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Đang thử...' : 'Thử lại'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
