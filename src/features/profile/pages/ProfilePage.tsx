import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Spinner } from '@/components/ui'
import { profileApi } from '@/api/profile.api'
import { ProfileInfoCard } from '../components/ProfileInfoCard'
import { ChangePasswordCard } from '../components/ChangePasswordCard'

/** UC 4/5/6 — Trang Hồ sơ cá nhân. */
export function ProfilePage() {
  // refetchOnMount 'always' để luôn lấy hồ sơ đầy đủ từ /profile (UC 4).
  const { data: profile, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: profileApi.me,
    refetchOnMount: 'always',
  })

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>

        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Spinner /> Đang tải thông tin…
          </div>
        ) : isError || !profile ? (
          <Alert variant="error">
            <div className="flex items-center justify-between gap-4">
              <span>Không tải được thông tin hồ sơ. Vui lòng thử lại.</span>
              <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
                Thử lại
              </Button>
            </div>
          </Alert>
        ) : (
          <div className="flex flex-col gap-6">
            <ProfileInfoCard profile={profile} />
            <ChangePasswordCard />
          </div>
        )}
      </div>
    </div>
  )
}
