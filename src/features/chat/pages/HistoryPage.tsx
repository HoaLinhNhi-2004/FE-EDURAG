import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  ChatBubbleIcon,
  Input,
  PageHeader,
  SearchIcon,
  Spinner,
  TrashIcon,
} from '@/components/ui'
import type { ApiError, ChatSession } from '@/types'
import { chatApi } from '@/api/chat.api'
import { useAuth } from '@/store/auth'
import { SessionCard } from '../components/SessionCard'

const SESSIONS_KEY = ['chat', 'sessions']

/** UC 9 — Lịch sử trò chuyện: danh sách phiên theo thời gian, mở lại hoặc xóa. */
export function HistoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const chatPath = user?.role === 'STUDENT' ? '/student' : '/dashboard/chat'

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: chatApi.listSessions,
  })

  const sessions = useMemo(() => data?.items ?? [], [data])

  // Tìm kiếm trong lịch sử (lọc client-side theo tiêu đề — BE không trả preview).
  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase()
    if (!k) return sessions
    return sessions.filter((s) => s.title.toLowerCase().includes(k))
  }, [sessions, keyword])

  const onMutationError = (err: ApiError) => setApiError(err.message)

  const deleteOne = useMutation({
    mutationFn: chatApi.deleteSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_KEY }),
    onError: onMutationError,
  })

  // Chưa có API "xóa tất cả" → tạm gọi DELETE từng phiên. Cần BE bổ sung endpoint.
  const deleteAll = useMutation({
    mutationFn: async (list: ChatSession[]) => {
      for (const s of list) await chatApi.deleteSession(s.id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_KEY }),
    onError: onMutationError,
  })

  const handleDeleteOne = (session: ChatSession) => {
    if (!window.confirm(`Xóa phiên "${session.title}"? Thao tác này không khôi phục được.`)) return
    setApiError(null)
    deleteOne.mutate(session.id)
  }

  const handleDeleteAll = () => {
    if (!window.confirm('Xóa tất cả lịch sử trò chuyện? Thao tác này không khôi phục được.')) return
    setApiError(null)
    deleteAll.mutate(sessions)
  }

  const busy = deleteOne.isPending || deleteAll.isPending

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <PageHeader
        title="Lịch sử trò chuyện"
        subtitle={`${sessions.length} phiên chat đã lưu`}
        actions={
          sessions.length > 0 ? (
            <Button
              variant="secondary"
              onClick={handleDeleteAll}
              loading={deleteAll.isPending}
              className="border-red-200 text-red-600 hover:bg-red-50 text-xs py-1.5"
            >
              <TrashIcon width={14} height={14} />
              Xóa tất cả
            </Button>
          ) : undefined
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-6">


        {apiError && (
          <Alert variant="error" className="mt-4">
            {apiError}
          </Alert>
        )}

        <div className="mt-6">
          <Input
            leftIcon={<SearchIcon />}
            placeholder="Tìm kiếm trong lịch sử..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <div className="mt-6">
          {isPending ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Spinner /> Đang tải lịch sử…
            </div>
          ) : isError ? (
            <Alert variant="error">
              <div className="flex items-center justify-between gap-4">
                <span>Không tải được lịch sử trò chuyện. Vui lòng thử lại.</span>
                <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
                  Thử lại
                </Button>
              </div>
            </Alert>
          ) : sessions.length === 0 ? (
            // UC 9: chưa có lịch sử là empty state, KHÔNG phải lỗi.
            <div className="flex flex-col items-center py-16 text-center text-slate-500">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <ChatBubbleIcon width={28} height={28} />
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-700">Chưa có lịch sử trò chuyện</p>
              <p className="mt-1 max-w-sm text-sm">
                Các phiên hỏi đáp của bạn sẽ được lưu tại đây để xem lại bất cứ lúc nào.
              </p>
              <Button className="mt-4" onClick={() => navigate(chatPath)}>
                Bắt đầu hỏi đáp
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              Không tìm thấy phiên chat nào khớp “{keyword}”.
            </p>
          ) : (
            <div className={busy ? 'flex flex-col gap-3 opacity-60' : 'flex flex-col gap-3'}>
              {filtered.map((session, idx) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  index={idx + 1}
                  onOpen={() => navigate(`${chatPath}?session=${session.id}`)}
                  onDelete={() => handleDeleteOne(session)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
