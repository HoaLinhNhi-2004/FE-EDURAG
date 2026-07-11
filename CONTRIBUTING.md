# Quy trình làm việc chung — FE-EDURAG

Áp dụng cho 2 thành viên: **TV Sỹ** (luồng Client/Sinh viên) và **LN Long** (luồng Giảng viên + Admin).
Tham chiếu task theo file kế hoạch `KeHoach_FE_Web_EduRAG.xlsx`.

## Branch

- `main` — luôn build được (`npm run build` sạch). **Không push thẳng lên main**, trừ hotfix nhỏ đã báo người kia.
- Mỗi task một branch, đặt tên theo mã task trong kế hoạch:

```
feat/2.1-register          # TV Sỹ — màn Đăng ký
feat/2.8-document-manager  # LN Long — dashboard học liệu
fix/...                    # sửa lỗi
```

## Pull Request

1. Xong task → mở PR vào `main`, điền theo template có sẵn.
2. Người còn lại review (ít nhất đọc lướt + chạy thử) rồi merge. PR nhỏ hơn 400 dòng thì review trong ngày.
3. Trước khi mở PR: `npm run build` phải sạch; tự chạy lại flow chính của màn hình mình sửa.

## Phân vùng code — tránh conflict

| Khu vực | Người phụ trách |
|---|---|
| `features/auth` (client), `features/chat`, `features/profile` | TV Sỹ |
| `features/documents`, `features/admin`, `layouts/`, `routes/`, `mocks/` | LN Long |
| `types/`, `api/client.ts`, `components/ui` (dùng chung) | **Báo nhau trước khi sửa** — đây là "hợp đồng" chung |

## Quy ước commit

Theo dạng `<type>: <mô tả ngắn>` — `feat` / `fix` / `chore` / `refactor`, ví dụ:

```
feat: man dang ky sinh vien (task 2.1)
fix: validate email @student khong bat loi rong
```

## Đồng bộ hằng ngày

- Đầu ngày: `git pull origin main` rồi rebase branch đang làm nếu cần.
- Cuối ngày: cập nhật cột **% Hoàn thành** trong `KeHoach_FE_Web_EduRAG.xlsx`.
