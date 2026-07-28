import { useQuery } from '@tanstack/react-query'
import { Alert, Button, PageHeader, Spinner } from '@/components/ui'
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
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden bg-slate-50">
      <PageHeader
        title="Hồ sơ cá nhân"
        subtitle="Quản lý thông tin tài khoản và đổi mật khẩu"
      />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8">

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
    </div>
  )
}
