# EduRAG — Giao Diện Web Frontend

EduRAG là giao diện web của hệ thống RAG Trợ lý Giáo dục & Đào tạo, hỗ trợ 3 vai trò người dùng: **Sinh viên**, **Giảng viên**, và **Quản trị viên**. Giao diện này kết nối trực tiếp đến hệ thống Backend dịch vụ API.

## 🚀 Công Nghệ Sử Dụng

* **Core**: React 19, TypeScript, Vite
* **Routing**: React Router
* **State Management & Data Fetching**: TanStack React Query v5, Axios
* **Styling**: Tailwind CSS v4

---

## 🛠️ Hướng Dẫn Cài Đặt và Khởi Chạy

### 1. Yêu cầu hệ thống
* **Node.js**: Phiên bản `18.x` trở lên (Khuyến nghị bản LTS mới nhất).
* **Trình quản lý gói**: `npm` đi kèm Node.js.

### 2. Cài đặt các gói phụ thuộc
Di chuyển vào thư mục dự án và chạy lệnh cài đặt:
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo hoặc chỉnh sửa tệp `.env.development` ở thư mục gốc của dự án để trỏ tới Backend API:

```env
# URL gốc kết nối đến API Backend
VITE_API_BASE_URL=http://localhost:3000/api
```

### 4. Khởi chạy dự án
Đảm bảo dịch vụ Backend đang hoạt động, sau đó khởi động server phát triển:
```bash
npm run dev
```
Sau khi khởi chạy thành công, truy cập vào ứng dụng tại địa chỉ: [http://localhost:5173](http://localhost:5173).

---

## 📦 Biên Dịch Production

Để kiểm tra kiểu dữ liệu (Typecheck) và biên dịch mã nguồn thành bản phân phối tối ưu (production bundle):
```bash
npm run build
```
Sản phẩm đầu ra sẽ được lưu tại thư mục `dist/`.

---

## 📂 Cấu Trúc Thư Mục Dự Án

Thư mục mã nguồn chính nằm trong `src/` và được tổ chức theo kiến trúc module hóa:

```text
src/
├── api/          # Cấu hình axios client, interceptors tự gắn JWT, xử lý lỗi 401
├── components/   # Các UI Component dùng chung (Button, Table, Alert, Modal, Input...)
│   └── ui/
├── features/     # Quản lý mã nguồn theo phân hệ chức năng (Xem chi tiết dưới đây)
│   ├── auth/     # Đăng ký, Đăng nhập, Quên/Đặt lại mật khẩu, OTP Admin
│   ├── chat/     # Giao diện Chat AI, Lịch sử chat, PDF Viewer Panel (trích dẫn tài liệu gốc)
│   ├── profile/  # Xem thông tin cá nhân, cập nhật hồ sơ, đổi mật khẩu
│   ├── documents/# Giao diện Giảng viên tải lên và quản lý tài liệu
│   └── admin/    # Dashboard Quản trị viên phê duyệt giảng viên, quản lý sinh viên
├── layouts/      # Các bố cục khung (Bố cục Đăng nhập, Bố cục Trang Dashboard, Trang Sinh viên)
├── routes/       # Cấu hình phân tuyến định tuyến và bảo mật định tuyến theo Vai trò
├── store/        # State quản lý Auth Session toàn cục
├── types/        # Định nghĩa các Interface TypeScript (Hợp đồng dữ liệu Request/Response với BE)
└── utils/        # Các hàm tiện ích (token storage, định dạng ngày tháng...)
```

---

## 📋 Quy Ước Phát Triển

1. **Import Đường Dẫn**: Luôn sử dụng ký tự alias `@/` thay cho đường dẫn tương đối (Ví dụ: `import { Button } from '@/components/ui'`).
2. **Giao Tiếp API**: Mọi yêu cầu gọi API phải thông qua `apiClient` được định nghĩa trong `src/api/client.ts`. Token JWT sẽ tự động được đính kèm vào Header và lỗi trả về sẽ được chuẩn hóa dưới dạng `ApiError`.
3. **Khai Báo Kiểu Dữ Liệu**: Các kiểu dữ liệu đại diện cho Request/Response của API phải được định nghĩa tập trung trong thư mục `src/types/`, không định nghĩa trực tiếp bên trong component.
4. **Xử Lý Lỗi Form**: Sử dụng `react-hook-form` kết hợp thư viện `zod` để khai báo các schema validate ở `src/features/auth/schemas.ts`.
