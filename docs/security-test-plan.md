# Kế hoạch kiểm thử bảo mật — family-tree-app

Tài liệu này mô tả cách kiểm thử bảo mật cho ứng dụng gia phả Next.js 16 + Prisma + PostgreSQL.

**Phiên bản app:** 0.1.0  
**Chuẩn tham chiếu:** OWASP ASVS 4.0.3 (Level 2), OWASP Top 10, OWASP API Security Top 10  
**Phạm vi chính:** `family-tree-app/`  
**Cập nhật:** 2026-07-22

---

## 1. Mục tiêu

1. Xác minh không ai truy cập trái phép trang/API quản trị.
2. Xác minh session HMAC, cookie flags, login/logout an toàn.
3. Phát hiện CSRF, XSS, injection, open redirect, IDOR, mass assignment.
4. Đánh giá rò rỉ dữ liệu cá nhân (hồ sơ, contact, newsletter, audit).
5. Kiểm tra cấu hình production, dependency CVE và secret hygiene.
6. Tạo checklist tái sử dụng + test regression cho CI.

---

## 2. Phạm vi

### 2.1 Trong phạm vi

| Nhóm | Thành phần |
|------|------------|
| UI | `/`, `/tree`, `/members`, `/profile/[id]`, `/news`, `/events`, `/memories`, `/analytics`, `/contact`, `/login`, `/admin`, `/privacy`, `/rules` |
| Auth | `POST /api/auth/login`, `POST /api/auth/logout`, cookie `family_tree_session` |
| Admin API | `/api/admin/members`, `/api/admin/requests`, `/api/admin/audit` |
| Public write API | `/api/contact`, `/api/newsletter` |
| Public read API | `/api/members`, `/api/tree`, `/api/news`, `/api/events` |
| Core libs | `src/lib/auth.ts`, `request-auth.ts`, `rate-limit.ts`, `safe-redirect.ts`, `proxy.ts` |
| Data | Prisma schema, seed admin, Docker Postgres, `data.json` fallback |
| Config | `.env*`, `next.config.ts`, `docker-compose.yml`, npm deps |

### 2.2 Ngoài phạm vi (vòng đầu)

- Hạ tầng cloud/WAF/DNS chưa được cung cấp
- Social engineering / phishing
- DoS tải lớn trên production
- Active exploit phá hoại dữ liệu thật

### 2.3 Nguyên tắc an toàn khi test

- Chỉ active scan trên **local/staging** có dữ liệu giả và được cho phép
- Sao lưu DB trước kiểm thử động
- Không đưa mật khẩu, cookie, PII thật vào báo cáo
- Không chạy destructive scanner trên production

---

## 3. Kiến trúc bảo mật hiện tại (baseline)

### 3.1 Cơ chế đã có

| Cơ chế | Vị trí | Ghi chú |
|--------|--------|---------|
| Session HMAC-SHA256 | `src/lib/auth.ts` | Token dạng `body.signature`, max age 7 ngày |
| Cookie httpOnly + SameSite=Lax | login/logout/proxy | `Secure` khi `NODE_ENV=production` |
| Login bcrypt + DB User | `api/auth/login` | Không lộ user/pass sai riêng lẻ |
| Rate limit login | 8 req / 15 phút / IP | In-memory per process |
| Rate limit contact/newsletter | 5 req / phút / IP | In-memory |
| Admin page guard | `src/proxy.ts` matcher `/admin/:path*` | Redirect `/login?next=...` |
| Admin API guard | `requireAdminSession()` | Kiểm tra cookie + role DB |
| CSRF-ish | `assertSameOrigin()` | Chỉ bật khi production; thiếu Origin thì **allow** |
| Open redirect guard | `safeRedirectPath()` | Chỉ relative path, chặn `//`, scheme smuggling |
| Audit log | `writeAudit()` | Best-effort; không fail business write |
| Input length limits | admin/contact/newsletter | slice theo field |

### 3.2 Giả thuyết rủi ro cần kiểm chứng

1. **CSRF:** `assertSameOrigin` cho phép request không có `Origin`; logout không kiểm tra Origin.
2. **Rate limit bypass:** in-memory → restart process / multi-instance / spoof `X-Forwarded-For`.
3. **IP trust:** `clientIp()` tin header client-controlled nếu reverse proxy không strip.
4. **Security headers:** `next.config.ts` chưa cấu hình CSP / XFO / HSTS / nosniff.
5. **Data exposure:** `/api/members`, `/api/tree`, profile public có thể lộ PII nhiều hơn chính sách mong muốn.
6. **Session vs cookie maxAge:** token logic 7 ngày; cookie 8h (không remember) hoặc 7 ngày (remember) — cần kiểm tra edge cases.
7. **Role revocation:** token còn hạn nhưng user bị hạ quyền/xóa trong DB — API đã check DB; page proxy chỉ check token.
8. **Docker Postgres local:** password mặc định + port publish `5433` — chỉ an toàn local, không production.
9. **Logout CSRF:** `POST /api/auth/logout` không auth/CSRF check.
10. **Mass assignment / image URL:** field `image` nhận URL string dài — XSS/SSRF qua renderer/optimizer.

---

## 4. Inventory endpoint & ma trận quyền

### 4.1 API

| Method | Path | Auth | CSRF/Origin | Rate limit | Ghi chú |
|--------|------|------|-------------|------------|---------|
| POST | `/api/auth/login` | Public | Không | 8/15m | Set cookie session |
| POST | `/api/auth/logout` | Public | Không | Không | Clear cookie |
| POST | `/api/contact` | Public | Prod only | 5/1m | Lưu ContactMessage |
| POST | `/api/newsletter` | Public | Prod only | 5/1m | Upsert email |
| GET | `/api/members` | Public | — | Không | Danh sách thành viên |
| GET | `/api/tree` | Public | — | Không | Cây gia phả |
| GET | `/api/news` | Public | — | Không | Tin tức |
| GET | `/api/events` | Public | — | Không | Sự kiện |
| GET | `/api/admin/members` | Admin | — | Không | |
| POST | `/api/admin/members` | Admin | Prod only | Không | Tạo thành viên |
| GET | `/api/admin/requests` | Admin | — | Không | |
| POST | `/api/admin/requests` | Admin | Prod only | Không | Tạo request |
| PATCH | `/api/admin/requests` | Admin | Prod only | Không | approve/reject |
| GET | `/api/admin/audit` | Admin | — | Không | 50 log gần nhất |

### 4.2 Ma trận quyền kỳ vọng

| Tài nguyên | Anonymous | Member session | Admin session |
|------------|-----------|----------------|---------------|
| Public pages | 200 | 200 | 200 |
| `/admin` | Redirect login | Redirect/deny | 200 |
| Admin GET APIs | 401 | 401/403 | 200 |
| Admin write APIs | 401 | 401/403 | 2xx (Origin OK) |
| Login invalid | 401 | 401 | 401 |
| Login valid admin | 200 + cookie | — | 200 |

> Hiện app chủ yếu dùng role `admin`. Role `member` tồn tại trong schema/token — phải test cả token `role=member` ký hợp lệ.

---

## 5. Phương pháp theo giai đoạn

### Giai đoạn 0 — Chuẩn bị

**Môi trường staging khuyến nghị**

```bash
cd family-tree-app
cp .env.example .env.local
# AUTH_SECRET >= 32 chars (openssl rand -base64 48)
# AUTH_ADMIN_* mạnh, khác production
docker compose up -d postgres
npm install
npm run db:setup
npm run build
NODE_ENV=production PORT=3100 npm run start
```

**Checklist chuẩn bị**

- [ ] Staging riêng, dữ liệu giả (không PII thật)
- [ ] 3 persona: anonymous / member / admin
- [ ] Backup DB trước active test
- [ ] Baseline: `npm run lint`, `npm test`, `npm run build`
- [ ] Smoke: `node --env-file=.env.local scripts/smoke.mjs http://localhost:3100`
- [ ] Ghi rules of engagement: host, thời gian, concurrency max

**Đầu ra:** inventory endpoint, baseline log, RoE.

---

### Giai đoạn 1 — Threat modeling & code review

Dùng **STRIDE** trên trust boundary:

```text
Browser ──HTTPS──> Next.js (proxy + App Router)
                      │
                      ├── cookies / session HMAC
                      ├── API routes
                      └── Prisma ──> PostgreSQL
```

**File review bắt buộc**

| File | Focus |
|------|-------|
| `src/lib/auth.ts` | forge token, expiry, role enum, secret length, timing-safe |
| `src/proxy.ts` | matcher coverage, cookie clear, redirect open? |
| `src/lib/request-auth.ts` | requireAdminSession, assertSameOrigin, audit fail-open |
| `src/lib/rate-limit.ts` | bucket cap, multi-instance, IP key |
| `src/lib/safe-redirect.ts` | `//evil`, `/\evil`, encoded, scheme |
| `src/app/api/auth/login/route.ts` | enumeration, cookie flags, body parsing |
| `src/app/api/auth/logout/route.ts` | CSRF logout |
| `src/app/api/admin/**` | authz, validation, mass assignment |
| `src/app/api/contact|newsletter` | spam, injection, PII retention |
| `prisma/schema.prisma` | sensitive fields, FK, cascade |
| `next.config.ts` | headers, image remotePatterns |
| `docker-compose.yml` | default creds, port exposure |

**Đầu ra:** threat model + checklist test case map ASVS.

---

### Giai đoạn 2 — SAST / SCA / secrets / config

Chạy từ `family-tree-app`:

```bash
# Dependency CVEs (runtime)
npm audit --omit=dev

# Unit/security helper tests hiện có
npm test

# Lint
npm run lint

# Build production
npm run build
```

**Công cụ bổ sung (khuyến nghị)**

| Công cụ | Mục đích |
|---------|----------|
| `npm audit` / `osv-scanner` | CVE dependencies |
| Semgrep / CodeQL | SAST TypeScript/Next |
| Gitleaks / TruffleHog | secret trong git history |
| `grep`/manual | hard-coded password, `dangerouslySetInnerHTML` |

**Config checks**

- [ ] `.env.local` không commit (`.gitignore`)
- [ ] `.env.example` không chứa secret thật
- [ ] `AUTH_SECRET` min 32, random
- [ ] Production: `ALLOW_DATA_FALLBACK=0`
- [ ] Postgres production không dùng password compose mặc định
- [ ] Không source map lộ server code/secret

**Đầu ra:** báo cáo SAST/SCA/secrets (đã triage false positive).

---

### Giai đoạn 3 — Auth & session testing

#### 3.1 Login

| ID | Test case | Kỳ vọng |
|----|-----------|---------|
| A-01 | Sai username | 401, message chung |
| A-02 | Đúng user, sai pass | 401, message giống A-01 |
| A-03 | Body rỗng / JSON lỗi | 400 |
| A-04 | Thiếu username hoặc password | 400 |
| A-05 | >8 lần fail / 15 phút cùng IP | 429 + `Retry-After` |
| A-06 | Spoof `X-Forwarded-For` khác nhau | Đánh giá bypass rate limit |
| A-07 | Login thành công | 200, cookie signed `body.sig` |
| A-08 | Cookie flags production | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` |
| A-09 | `remember=true` | maxAge ~ 7 ngày |
| A-10 | `remember=false` | maxAge ~ 8 giờ |
| A-11 | `next=//evil.com` | redirect fallback `/admin` |
| A-12 | `next=/admin` | redirect `/admin` |
| A-13 | Response không chứa password/hash | Pass |
| A-14 | Timing user tồn tại vs không | Không khác biệt rõ (best-effort) |

**curl mẫu**

```bash
# Login fail
curl -sS -D- -X POST http://localhost:3100/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"x","password":"y"}'

# Rate limit
for i in $(seq 1 12); do
  curl -sS -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3100/api/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"username":"x","password":"y"}'
done
```

#### 3.2 Session token

| ID | Test case | Kỳ vọng |
|----|-----------|---------|
| S-01 | Token unsigned (chỉ base64 JSON) | Reject (smoke đã cover) |
| S-02 | Đổi role trong body, giữ sig cũ | Reject |
| S-03 | Đổi username, giữ sig | Reject |
| S-04 | Signature rỗng / random | Reject |
| S-05 | Token hết hạn (`issuedAt` cũ > 7d) | Reject |
| S-06 | `issuedAt` tương lai > 5 phút | Reject |
| S-07 | Role `superadmin` / `null` | Reject |
| S-08 | Body/signature quá dài | Reject |
| S-09 | Secret khác | Reject |
| S-10 | Token hợp lệ admin | `/admin` = 200 |

Unit tests hiện có trong `src/lib/auth.test.ts` — chạy `npm test` và bổ sung case thiếu.

#### 3.3 Authorization

| ID | Test case | Kỳ vọng |
|----|-----------|---------|
| Z-01 | GET `/admin` no cookie | 3xx → `/login` |
| Z-02 | GET `/admin` forged cookie | 3xx |
| Z-03 | GET `/api/admin/*` no cookie | 401 |
| Z-04 | Token `role=member` hợp lệ | admin API 401/403 |
| Z-05 | Token admin nhưng user DB role=member | API 403 |
| Z-06 | Token admin nhưng user đã xóa | API 403 |
| Z-07 | Admin hợp lệ GET members/requests/audit | 200 |
| Z-08 | Admin POST member thiếu name | 400 |
| Z-09 | Anonymous POST admin member | 401 |

```bash
# Admin API without session
curl -sS -D- http://localhost:3100/api/admin/members
curl -sS -D- http://localhost:3100/api/admin/audit
curl -sS -D- -X POST http://localhost:3100/api/admin/members \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test"}'
```

#### 3.4 Logout & fixation

| ID | Test case | Kỳ vọng |
|----|-----------|---------|
| L-01 | POST logout | cookie maxAge=0 |
| L-02 | Dùng cookie cũ sau logout | `/admin` reject (cookie cleared client-side; server vẫn accept token nếu gửi lại — ghi nhận residual risk) |
| L-03 | Login CSRF / session fixation | Session mới sau login, không tái dùng pre-login attacker cookie như session hợp lệ |
| L-04 | Logout từ origin lạ (prod) | Ghi nhận CSRF logout risk |

---

### Giai đoạn 4 — API input, injection, XSS, IDOR

#### 4.1 Validation matrix (mỗi write endpoint)

- Method không hỗ trợ (GET/PUT/DELETE nếu không export)
- Content-Type sai
- JSON malformed / empty body
- Field thiếu, sai kiểu, quá dài, Unicode, null byte
- Duplicate submit / race

#### 4.2 Injection

| ID | Payload hướng | Endpoint | Kỳ vọng |
|----|---------------|----------|---------|
| I-01 | SQL meta `' OR 1=1--` | login username, search-like fields | Không SQL error; Prisma safe |
| I-02 | NoSQL-ish object injection | JSON body nested | 400 hoặc ignore |
| I-03 | Template/SSTI `{{7*7}}` | name/detail | Không evaluate |
| I-04 | Path traversal in id | profile / admin ids | 404/400 |

#### 4.3 XSS

Thử stored XSS qua:

- Admin member: `name`, `role`, `quote`, `image`, `branch`
- Admin request: `name`, `detail`, `image`
- Contact: `name`, `message`
- Newsletter: `email` (limited)

Payload gợi ý (an toàn staging):

```text
"><script>alert(1)</script>
<img src=x onerror=alert(1)>
javascript:alert(1)
```

Kỳ vọng: encode/escape khi render; không execute trong admin UI hay public pages.

#### 4.4 Image URL / SSRF

| ID | `image` value | Kỳ vọng |
|----|---------------|---------|
| M-01 | `https://lh3.googleusercontent.com/...` | OK nếu domain allow |
| M-02 | `http://127.0.0.1:5433/` | Không server-side fetch nội bộ |
| M-03 | `javascript:alert(1)` | Không thành active URL nguy hiểm |
| M-04 | URL > 2000 chars | Bị slice/reject |

#### 4.5 Mass assignment / business logic

| ID | Test | Kỳ vọng |
|----|------|---------|
| B-01 | POST member kèm `verified:true`, `id` tự chọn, `sortOrder` | Không set field ngoài whitelist |
| B-02 | PATCH request `status=approved` + field lạ | Chỉ đổi status hợp lệ |
| B-03 | `parentId` trỏ id không tồn tại | 400 |
| B-04 | `parentId` tạo chu trình quan hệ | Reject hoặc không corrupt tree |
| B-05 | Race approve cùng request 2 lần | Idempotent / consistent |

#### 4.6 Public data exposure

| ID | Test | Kỳ vọng |
|----|------|---------|
| P-01 | GET `/api/members` | Chỉ field được phép public |
| P-02 | GET `/api/tree` | Không lộ admin-only metadata |
| P-03 | Profile page | Không lộ email contact / audit |
| P-04 | Error 500 | Không stack trace / DATABASE_URL |

---

### Giai đoạn 5 — CSRF, CORS, browser headers

#### 5.1 CSRF cases (production mode)

| ID | Request | Origin | Kỳ vọng |
|----|---------|--------|---------|
| C-01 | POST admin members | `https://evil.example` | 403 |
| C-02 | PATCH admin requests | `https://evil.example` | 403 |
| C-03 | POST contact | `https://evil.example` | 403 |
| C-04 | POST newsletter | `https://evil.example` | 403 |
| C-05 | POST admin members | *(no Origin)* | **Ghi nhận:** hiện allow — quyết định harden |
| C-06 | POST admin members | `null` | 403 hoặc policy rõ |
| C-07 | Host mismatch vs Origin | spoof Host | 403 / fail closed |
| C-08 | Logout cross-origin | evil Origin | Ghi nhận residual risk |
| C-09 | Login cross-origin | evil Origin | Không set session hữu ích cho attacker site (SameSite) |

```bash
# CSRF foreign origin (production)
curl -sS -D- -X POST http://localhost:3100/api/admin/members \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://evil.example' \
  -H 'Cookie: family_tree_session=VALID_TOKEN' \
  -d '{"name":"CSRF Test"}'
```

#### 5.2 Security headers (đo response thật)

```bash
curl -sSI http://localhost:3100/ | sed -n '1,40p'
curl -sSI http://localhost:3100/admin | sed -n '1,40p'
```

| Header | Mục tiêu |
|--------|----------|
| `Content-Security-Policy` | Giảm XSS impact |
| `X-Frame-Options` / CSP `frame-ancestors` | Chống clickjacking |
| `X-Content-Type-Options: nosniff` | MIME sniffing |
| `Referrer-Policy` | Giảm leak URL |
| `Permissions-Policy` | Tắt API không cần |
| `Strict-Transport-Security` | HTTPS production |

---

### Giai đoạn 6 — DAST

**Công cụ**

- OWASP ZAP Baseline (passive) → Authenticated scan staging
- Burp Suite / ZAP Manual Explore
- curl / Newman collection cho regression API
- Browser DevTools cho DOM XSS

**Quy tắc**

- Không active scan production
- Giới hạn thread/rate
- Authenticated scan dùng tài khoản staging riêng
- Lưu evidence đã redaction

**Smoke security tối thiểu (đã có một phần)**

```bash
npm run build
PORT=3100 npm run start
# terminal khác:
node --env-file=.env.local scripts/smoke.mjs http://localhost:3100
```

Smoke hiện cover: public pages, admin redirect, forged cookie reject, login fail/success, signed cookie.  
**Nên mở rộng** (xem mục 8).

---

### Giai đoạn 7 — Database, privacy, operations

| ID | Kiểm tra | Kỳ vọng |
|----|----------|---------|
| D-01 | App DB user không superuser (prod) | Least privilege |
| D-02 | `DATABASE_URL` không lộ qua API/UI/log client | Pass |
| D-03 | Password chỉ lưu bcrypt hash | Không plaintext |
| D-04 | Backup/restore drill | Restore thành công |
| D-05 | Contact/newsletter retention policy | Có quy trình xóa/export |
| D-06 | Audit không chứa password/token | Pass |
| D-07 | Chỉ admin đọc audit | 401/403 khác role |
| D-08 | Rotate `AUTH_SECRET` | Session cũ invalid; có runbook |
| D-09 | Alert brute force / hàng loạt 401 | Có log/monitor (prod) |
| D-10 | Docker Postgres port 5433 | Không expose public internet |

---

### Giai đoạn 8 — Findings, fix, retest

**Severity**

- Dùng CVSS 3.1 + tác động nghiệp vụ (dữ liệu gia đình nhạy cảm)

**SLA đề xuất**

| Severity | Thời hạn |
|----------|----------|
| Critical | Cô lập ngay; sửa 24–48h |
| High | 7 ngày |
| Medium | 30 ngày |
| Low | 60–90 ngày |

**Template finding**

```markdown
### [SEVERITY] Tiêu đề ngắn
- **Endpoint/File:**
- **Điều kiện:**
- **PoC (an toàn):**
- **Tác động:**
- **Khuyến nghị sửa:**
- **Retest:** PASS/FAIL — ngày
```

Sau khi sửa:

1. Retest từng finding
2. `npm run lint && npm test && npm run build`
3. Smoke + các case auth/admin mới
4. Thêm regression test vào repo

---

## 6. Checklist OWASP (rút gọn theo app)

### A01 Broken Access Control

- [ ] Admin page + mọi admin API
- [ ] Role member không escalate
- [ ] Revoke role trong DB có hiệu lực với API
- [ ] Không IDOR trên request/member ids

### A02 Cryptographic Failures

- [ ] AUTH_SECRET đủ mạnh, không commit
- [ ] bcrypt password hash
- [ ] Cookie Secure trên HTTPS prod
- [ ] DB TLS (prod)

### A03 Injection

- [ ] Prisma parameterized
- [ ] Không raw SQL user-controlled
- [ ] Header/log injection trong audit meta

### A04 Insecure Design

- [ ] Rate limit auth/write
- [ ] CSRF policy rõ ràng
- [ ] Single-admin model được chấp nhận rủi ro hoặc nâng cấp

### A05 Security Misconfiguration

- [ ] Security headers
- [ ] Default Docker password không dùng prod
- [ ] Error message không lộ nội bộ
- [ ] `ALLOW_DATA_FALLBACK=0` prod

### A06 Vulnerable Components

- [ ] `npm audit --omit=dev` clean Critical/High
- [ ] Next/React/Prisma versions theo dõi advisory

### A07 Identification & Auth Failures

- [ ] Session forge/tamper reject
- [ ] Brute force limited
- [ ] Generic login errors
- [ ] Logout clears cookie

### A08 Software/Data Integrity

- [ ] lockfile integrity
- [ ] seed không ghi đè admin prod ngoài ý muốn

### A09 Logging & Monitoring Failures

- [ ] login success/fail audit
- [ ] admin mutations audit
- [ ] audit fail không silent hoàn toàn (có server log)

### A10 SSRF

- [ ] image URL không trigger server fetch nội bộ
- [ ] remotePatterns Next Image giới hạn domain

---

## 7. Lịch đề xuất (5 ngày + retest)

| Ngày | Công việc | Verify |
|------|-----------|--------|
| 1 | Inventory, RoE, baseline, threat model | Baseline commands pass |
| 2 | Code review, SAST, SCA, secrets, config | Báo cáo triage xong |
| 3 | Auth, session, authorization, rate limit | Ma trận quyền pass/fail ghi nhận |
| 4 | API validation, XSS, CSRF, privacy | Evidence PoC |
| 5 | DAST, DB/ops, tổng hợp findings | Draft report |
| +N | Fix + retest Critical/High | CI green + retest PASS |

---

## 8. Regression tests nên bổ sung

Ưu tiên test route/workflow thật (không chỉ helper):

1. **Auth token** — forged/unsigned/expired/future/invalid-role *(một phần đã có trong `auth.test.ts`)*
2. **Login route** — fail/success đồng nhất, 429, cookie flags, safe redirect
3. **Admin authorization matrix** — anonymous/member/admin × methods
4. **Role revocation** — token admin + DB role member → 403
5. **CSRF** — foreign Origin trên write endpoints (prod)
6. **Input validation** — XSS strings stored + rendered safely; oversize fields
7. **Rate limit** — boundary + XFF trust documentation/test
8. **Public data shape** — members/tree không trả field nội bộ
9. **Security headers** — assert trên response production build
10. **Audit** — login fail/success và admin write tạo log; không chứa secret

**Mở rộng smoke (`scripts/smoke.mjs`) đề xuất**

- [ ] GET admin APIs without cookie → 401
- [ ] POST contact rate limit / validation
- [ ] Foreign Origin write → 403 khi `NODE_ENV=production`
- [ ] Logout clears session cookie
- [ ] Open redirect rejected on login `next`

---

## 9. Tiêu chí hoàn thành đợt test

- [ ] 100% route/API trong inventory đã gán test owner/result
- [ ] Toàn bộ case Critical/High (authz, session, CSRF, PII) đã chạy
- [ ] Không còn Critical/High mở mà chưa có quyết định xử lý
- [ ] `npm run lint`, `npm test`, `npm run build` pass
- [ ] Smoke pass trên production build
- [ ] `npm audit --omit=dev` không còn Critical/High chưa xử lý/waiver
- [ ] Findings đã retest; regression tests đã thêm hoặc ticket hóa
- [ ] Báo cáo không chứa secret/PII thật

---

## 10. Deliverables

1. Threat model + trust boundary diagram (mục 5.1)
2. Endpoint inventory + ma trận quyền (mục 4)
3. Checklist ASVS/OWASP đã tick (mục 6)
4. Báo cáo findings theo severity + PoC an toàn
5. Quick wins vs backlog hardening
6. Retest report + danh sách test CI mới

---

## 11. Quick wins (dựa trên review tĩnh ban đầu)

> Đây là **giả thuyết ưu tiên**, cần xác nhận bằng test động trước khi kết luận vulnerability.

| Ưu tiên | Hạng mục | Gợi ý |
|---------|----------|-------|
| P0 | CSRF policy | Fail-closed khi thiếu Origin trên state-changing requests; cân nhắc CSRF token |
| P0 | Security headers | Thêm CSP, frame-ancestors, nosniff, Referrer-Policy, HSTS (prod) |
| P1 | Rate limit phân tán | Redis/Upstash nếu >1 instance |
| P1 | Trust proxy IP | Chỉ tin `X-Forwarded-For` từ proxy đã biết |
| P1 | Logout CSRF | Require same-origin hoặc session auth |
| P1 | Session invalidation | Server-side denylist/version khi logout/revoke |
| P2 | Public PII policy | Field allowlist cho `/api/members` & profile |
| P2 | Admin password lifecycle | Đổi mật khẩu, multi-user, tắt seed creds prod |
| P2 | Expand smoke/security tests | Mục 8 |

---

## 12. Lệnh tham chiếu nhanh

```bash
cd family-tree-app

# Baseline
npm run lint
npm test
npm run build
npm audit --omit=dev

# Staging server
docker compose up -d postgres
npm run db:setup
PORT=3100 npm run start

# Smoke
node --env-file=.env.local scripts/smoke.mjs http://localhost:3100
```

---

## 13. Phụ lục — Mapping file quan trọng

| Concern | Path |
|---------|------|
| Session crypto | `src/lib/auth.ts` |
| Session tests | `src/lib/auth.test.ts` |
| Admin gate (edge) | `src/proxy.ts` |
| Admin gate (API) | `src/lib/request-auth.ts` |
| Rate limit | `src/lib/rate-limit.ts` |
| Redirect safety | `src/lib/safe-redirect.ts` |
| Login | `src/app/api/auth/login/route.ts` |
| Logout | `src/app/api/auth/logout/route.ts` |
| Admin members | `src/app/api/admin/members/route.ts` |
| Admin requests | `src/app/api/admin/requests/route.ts` |
| Admin audit | `src/app/api/admin/audit/route.ts` |
| Contact | `src/app/api/contact/route.ts` |
| Newsletter | `src/app/api/newsletter/route.ts` |
| Schema | `prisma/schema.prisma` |
| Smoke | `scripts/smoke.mjs` |
| Env template | `.env.example` |

---

*Tài liệu này là kế hoạch kiểm thử, không phải báo cáo pentest. Kết quả pass/fail chỉ có sau khi thực thi các giai đoạn trên môi trường được phép.*
