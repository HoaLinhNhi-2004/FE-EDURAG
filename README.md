# Edu RAG — Frontend Web

Hệ thống RAG Trợ lý Giáo dục & Đào tạo — giao diện web cho 3 vai trò: Sinh viên, Giảng viên, Quản trị viên.

**Stack:** Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router · TanStack Query · Axios

## Chạy project

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + build production
```

Biến môi trường trong `.env.development`:

| Biến | Ý nghĩa |
|------|---------|
| `VITE_API_BASE_URL` | Base URL API backend |
| `VITE_ENABLE_MOCK` | `true` = chạy bằng MSW mock, không cần BE |

## Cấu trúc thư mục (task 1.2 — đã chốt, cả team theo cấu trúc này)

```
src/
├── api/          # axios client + interceptor JWT/401, queryClient, endpoint theo module (auth.api.ts, ...)
├── components/   # UI dùng chung (Button, Modal, Table, EmptyState...)
│   └── ui/
├── features/     # code theo phân hệ — mỗi feature gồm pages/ components/ hooks/ riêng
│   ├── auth/         # Đăng ký, Đăng nhập, Quên mật khẩu (UC 1-3, 12-14, 19)
│   ├── chat/         # Trang chủ, Chat AI, Lịch sử, PDF Viewer (UC 7-11)
│   ├── profile/      # Xem/sửa hồ sơ, đổi mật khẩu (UC 4-6, 15-16)
│   ├── documents/    # Quản lý học liệu Giảng viên (UC 17-18)
│   └── admin/        # Duyệt GV, quản lý SV, pipeline, FinOps (UC 20-23)
├── layouts/      # AuthLayout, ClientLayout, DashboardLayout (task 1.4 — LN Long)
├── routes/       # route config + ProtectedRoute theo role (task 1.3 — LN Long)
├── mocks/        # MSW handlers + mock data (task 3.3 — LN Long)
├── hooks/        # hook dùng chung (useAuth, useDebounce...)
├── store/        # state toàn cục (auth session...)
├── types/        # req/res model — "hợp đồng" FE-BE (task 3.2)
└── utils/        # helper (token storage, format...)
```

## Quy ước

- Import tuyệt đối qua alias `@/` (vd. `import { apiClient } from '@/api/client'`).
- Mọi call API đi qua `apiClient` — JWT tự gắn, lỗi đã chuẩn hóa thành `ApiError`, 401 tự đưa về `/login`.
- Kiểu dữ liệu req/res khai báo trong `src/types/`, không định nghĩa inline trong component.
- Tham chiếu yêu cầu: file `EDURAG_TT VTCPay.xlsx` (sheet **Chức năng**) và kế hoạch `KeHoach_FE_Web_EduRAG.xlsx`.
