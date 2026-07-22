# Gia Phả Dòng Họ (Next.js + Prisma + Docker Postgres)

Ứng dụng web gia phả với backend PostgreSQL chạy bằng Docker, auth có hash mật khẩu, admin lưu server, newsletter/contact API và audit log.

## Yêu cầu

- Node.js 20+
- Docker Desktop
- Sao chép env:

```bash
cp .env.example .env.local
# openssl rand -base64 48  → AUTH_SECRET
# Đặt AUTH_ADMIN_USERNAME / AUTH_ADMIN_PASSWORD (dùng khi seed)
```

| Biến | Mô tả |
|------|------|
| `AUTH_SECRET` | Secret HMAC phiên (≥ 32 ký tự) |
| `AUTH_ADMIN_USERNAME` | User admin khi seed |
| `AUTH_ADMIN_PASSWORD` | Mật khẩu seed (≥ 8 ký tự), lưu bcrypt trong DB |
| `DATABASE_URL` | Postgres Docker local: `localhost:5433/family_tree_app` |
| `ALLOW_DATA_FALLBACK` | `1`/`0` — bật/tắt fallback `data.json` khi DB trống/lỗi (mặc định: bật ngoài production) |


## Chạy Local Bằng Docker DB

```bash
npm install
docker compose up -d postgres
npm run db:setup
npm run dev
```

Mặc định app chạy tại:

```bash
http://localhost:3000
```

Postgres chạy tại:

```bash
localhost:5433
```

## Scripts

```bash
npm run build        # prisma generate + next build
npm run start        # next start
npm run start:prod   # db push + next start
npm run lint
npm test
npm run test:smoke   # cần server + .env.local
npm run db:push      # sync schema vào Docker Postgres
npm run db:seed      # seed admin + dữ liệu mẫu
npm run db:setup     # db push + seed
npm run db:reset
```

## Kiến Trúc Dữ Liệu

- Prisma + PostgreSQL
- Docker Compose service: `postgres`
- Bảng: `User`, `FamilyMember` (FK `parentId`), `AdminRequest`, `NewsletterSubscription`, `ContactMessage`, `NewsArticle`, `FamilyEvent`, `AuditLog`
- Session cookie `family_tree_session` = `payload.HMAC`
- Edge proxy bảo vệ `/admin`
- Login dùng bcrypt so khớp `User.passwordHash` + rate limit
- Admin duyệt/bác, thêm nhân khẩu, chiếu chỉ → DB + audit
- Newsletter/Contact → DB

## API Chính

| Method | Path | Mô tả |
|--------|------|------|
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/logout` | Đăng xuất |
| POST | `/api/newsletter` | Đăng ký email |
| POST | `/api/contact` | Form liên hệ |
| GET | `/api/members` | Danh sách thành viên |
| GET | `/api/tree` | Cây gia phả |
| GET/PATCH/POST | `/api/admin/requests` | Sớ ký admin |
| GET/POST | `/api/admin/members` | Nhân khẩu admin |
| GET | `/api/admin/audit` | Audit log |
| GET | `/api/news` | Tin tức |
| GET | `/api/events` | Sự kiện |

## Bảo mật

Kế hoạch kiểm thử bảo mật (OWASP ASVS L2, inventory API, auth/session, CSRF, DAST, checklist):

- [`docs/security-test-plan.md`](./docs/security-test-plan.md)

## Production Checklist

- [ ] Đổi `AUTH_SECRET` và mật khẩu admin mạnh

- [ ] Dùng managed Postgres thay Docker local
- [ ] Backup DB
- [ ] HTTPS + secure cookies
- [ ] Rate limit phân tán nếu scale nhiều instance
- [ ] Object storage cho ảnh
- [ ] Email provider cho newsletter
- [ ] Migration strategy rõ ràng trước production thật
- [ ] Production: seed DB thật, `ALLOW_DATA_FALLBACK=0` (không dùng data.json làm nguồn live)
- [ ] Analytics/gender: thêm field giới tính chính thức nếu cần KPI chính xác

