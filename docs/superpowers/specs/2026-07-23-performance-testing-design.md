# Thiết kế kiểm thử hiệu năng cho Family Tree App

- **Ngày:** 2026-07-23
- **Trạng thái:** Đã duyệt thiết kế hội thoại, chờ duyệt bản spec
- **Phạm vi:** `family-tree-app`

## 1. Bối cảnh

Family Tree App là ứng dụng gia phả tiếng Việt sử dụng Next.js 16 App Router, React 19, TypeScript, Prisma và PostgreSQL. Ứng dụng có các trang công khai, cây gia phả, hồ sơ thành viên, trang đăng nhập, khu vực quản trị được bảo vệ và các API đọc/ghi dữ liệu.

Repository hiện có unit test và HTTP smoke test nhưng chưa có bộ kiểm thử hiệu năng chuyên biệt. Bộ kiểm thử mới phải hoạt động ở local/CI và VPS production-like, đồng thời đánh giá cân bằng ba nhóm:

1. Trải nghiệm người dùng và Core Web Vitals.
2. Độ trễ, throughput và tỷ lệ lỗi của HTTP/API.
3. Mức sử dụng và điểm bão hòa của VPS, Node.js và PostgreSQL.

Traffic mục tiêu chưa được biết trước. Vì vậy thiết kế phải tìm ngưỡng chịu tải bằng ramp test thay vì mặc định một con số concurrent users cố định.

## 2. Mục tiêu

- Thiết lập baseline hiệu năng có thể tái lập.
- Phát hiện regression sớm trên pull request.
- Đo tải định kỳ trong nightly CI.
- Tìm knee point, maximum sustainable load và breaking point trên VPS production-like.
- Đánh giá khả năng chịu spike và phục hồi sau tải.
- Phát hiện memory leak, connection leak hoặc suy giảm theo thời gian.
- Sinh báo cáo có thể so sánh giữa các commit và lần release.
- Bảo vệ production và dữ liệu thật khỏi write test hoặc stress test ngoài ý muốn.

## 3. Ngoài phạm vi

- Không xây dựng hệ thống observability dài hạn đầy đủ bằng Prometheus/Grafana trong giai đoạn đầu.
- Không chạy write test, stress test hoặc spike test vào production thật.
- Không dùng Lighthouse lab data để tuyên bố INP thực tế của người dùng.
- Không tối ưu mã nguồn ứng dụng trong hạng mục thiết kế và dựng test harness này.
- Không dùng kết quả từ runner khác loại để kết luận regression tuyệt đối.

## 4. Phương án được chọn

Sử dụng **k6 + Lighthouse CI + thu thập metrics VPS/PM2/PostgreSQL**.

- **k6:** baseline, smoke, load, stress, spike và soak test cho trang SSR/API.
- **Lighthouse CI:** performance budget và Core Web Vitals dạng lab cho các trang trọng yếu.
- **Metrics hệ thống:** CPU, RAM, swap, PM2/Node và PostgreSQL trong các lần chạy production-like.
- **Báo cáo hợp nhất:** JSON cho máy xử lý và Markdown/HTML cho người review.

Phương án này bao phủ đầy đủ frontend, backend và hạ tầng nhưng nhẹ hơn việc vận hành một observability stack hoàn chỉnh. Kịch bản k6 và schema báo cáo phải được thiết kế để có thể tích hợp Grafana/Prometheus sau này mà không viết lại journey.

## 5. Kiến trúc thư mục

Các artifact dự kiến nằm trong:

```text
performance/
├── k6/
│   ├── scenarios/
│   │   ├── smoke.js
│   │   ├── load.js
│   │   ├── stress.js
│   │   ├── spike.js
│   │   └── soak.js
│   ├── journeys/
│   │   ├── public-reader.js
│   │   ├── family-browser.js
│   │   ├── authenticated-admin.js
│   │   └── public-writer.js
│   ├── lib/
│   │   ├── config.js
│   │   ├── auth.js
│   │   ├── checks.js
│   │   └── metrics.js
│   └── data/
│       └── test-fixtures.json
├── lighthouse/
│   └── lighthouserc.cjs
├── scripts/
│   ├── capture-server-metrics.sh
│   └── summarize-results.mjs
├── budgets/
│   └── performance-budgets.json
└── README.md
```

### 5.1 Trách nhiệm thành phần

- `scenarios/`: định nghĩa tải, ramp stages, thời gian giữ tải và điều kiện dừng.
- `journeys/`: mô tả hành vi người dùng độc lập với mức tải.
- `lib/`: cấu hình môi trường, auth, checks và custom metrics dùng chung.
- `data/`: fixture không chứa bí mật; dữ liệu ghi phải có namespace theo test run.
- `lighthouse/`: cấu hình trang, preset và assertions.
- `budgets/`: nguồn duy nhất cho các ngưỡng pass/fail dùng chung.
- `scripts/`: thu metrics máy chủ và chuẩn hóa kết quả.

Journey không được gắn cứng với số VU để có thể tái sử dụng trong nhiều scenario.

## 6. Phạm vi endpoint và trang

### 6.1 Trang ưu tiên

- `/`
- `/tree`
- `/members`
- `/profile/[id]` với ID fixture hợp lệ
- `/news`
- `/events`
- `/login`
- `/admin` sau xác thực trên staging

### 6.2 API đọc

- `GET /api/tree`
- `GET /api/members`
- `GET /api/news`
- `GET /api/events`
- Các API admin read-only cần thiết cho dashboard/audit sau xác thực

### 6.3 API ghi và xác thực

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/newsletter`
- `POST /api/contact`
- Các thao tác admin requests/members được chọn lọc trên staging database riêng

Write journey phải dùng dữ liệu định danh theo lần chạy, có giới hạn tốc độ và cơ chế cleanup hoặc reset database staging.

## 7. Workload model

Phân bổ mặc định cho mixed workload:

| Journey | Tỷ lệ | Hành vi chính |
|---|---:|---|
| Public reader | 35% | Trang chủ, tin tức, sự kiện |
| Family browser | 45% | Danh sách, cây gia phả, hồ sơ thành viên |
| Authenticated admin | 10% | Đăng nhập, dashboard và audit read-only |
| Public writer | 10% | Contact hoặc newsletter bằng fixture riêng |

Tỷ lệ là mặc định có version-control. Khi có production analytics đáng tin cậy, workload mix có thể được cập nhật qua một thay đổi được review thay vì sửa trực tiếp trong CI.

Mỗi journey phải có think time hợp lý để tránh biến bài test thành benchmark HTTP thuần túy. Bài test API endpoint riêng có thể bỏ think time khi mục tiêu là đo giới hạn endpoint.

## 8. Các profile kiểm thử

### 8.1 Baseline

- 1 VU, chạy tuần tự.
- Warm-up trước khi ghi nhận kết quả.
- Thu latency, response size và lỗi ban đầu.
- Không dùng kết quả này làm capacity limit.

### 8.2 PR smoke

- 1–5 VU trong khoảng 1–2 phút.
- Xác nhận script, endpoint, authentication và hard budget cơ bản.
- Chạy Lighthouse cho nhóm trang trọng yếu với số lần đủ để giảm nhiễu theo khả năng CI.
- Mục tiêu là phản hồi nhanh; không tìm ngưỡng chịu tải trên PR.

### 8.3 Nightly load

- Ramp theo các bậc khởi đầu: 5 → 10 → 25 → 50 → 100 VU.
- Mỗi bậc có warm-up/ramp và hold period riêng.
- Dừng tăng khi safety threshold bị vi phạm liên tục.
- Ghi nhận latency, throughput, error rate và resource metrics nếu runner cho phép.
- Các bậc tải phải cấu hình được mà không sửa journey.

### 8.4 Stress tìm ngưỡng

- Khởi đầu dưới mức ổn định gần nhất từ load test.
- Tăng 25–50% mỗi bậc và giữ đủ lâu để phát hiện trạng thái ổn định.
- Xác định:
  - **Knee point:** throughput tăng chậm hoặc phẳng trong khi latency tăng nhanh.
  - **Maximum sustainable load:** mức cao nhất duy trì toàn bộ SLO.
  - **Breaking point:** error, timeout hoặc resource saturation vượt giới hạn.
- Sau khi chạm safety stop, giảm tải có kiểm soát và đo phục hồi.

### 8.5 Spike

- Bắt đầu từ tải thấp ổn định.
- Tăng đột ngột lên 2–3 lần maximum sustainable load đã đo được.
- Nếu chưa có sustainable load, spike test chỉ được chạy sau stress discovery trong cùng môi trường.
- Đánh giá queueing, rate limiting, lỗi, timeout và phục hồi.

### 8.6 Soak

- Chạy 60–120 phút ở 60–70% maximum sustainable load.
- Theo dõi xu hướng RAM, event-loop lag, DB connections, latency và error rate.
- Ưu tiên chạy khi có thay đổi liên quan DB, SSR, caching, image handling hoặc dependency runtime.

## 9. SLO và performance budget ban đầu

Các ngưỡng dưới đây là budget khởi đầu. Sau baseline đầu tiên có thể điều chỉnh bằng pull request có giải thích và bằng chứng; pipeline không được tự nới ngưỡng để làm test xanh.

### 9.1 HTTP/API

| Chỉ số | Read API | Write/Auth API |
|---|---:|---:|
| p50 | ≤ 250 ms | ≤ 400 ms |
| p95 | ≤ 750 ms | ≤ 1.000 ms |
| p99 | ≤ 1.500 ms | ≤ 2.000 ms |
| Unexpected error rate | < 1% | < 1% |
| Check failure rate | < 1% | < 1% |

Các phản hồi được mong đợi theo scenario, ví dụ `429` trong bài kiểm tra rate limit, phải được phân loại riêng. Chúng không được tính là application failure nhưng vẫn phải xuất hiện trong báo cáo.

### 9.2 Lighthouse và frontend

Áp dụng tối thiểu cho `/`, `/tree`, `/members`, một `/profile/[id]` hợp lệ và `/login`:

- Lighthouse Performance score ≥ 80 trên mobile simulated.
- LCP ≤ 2,5 giây.
- CLS ≤ 0,1.
- TBT ≤ 300 ms.

Lighthouse chỉ cung cấp lab metrics. INP thực tế cần Real User Monitoring và không phải hard gate trong giai đoạn này.

### 9.3 VPS, Node.js và PostgreSQL

- CPU trung bình dưới 75% trong hold period.
- CPU không duy trì trên 90% quá 60 giây.
- RAM sử dụng dưới 85%.
- RAM không tăng đều không hồi phục trong soak test.
- Không có swap activity kéo dài.
- Event-loop lag p95 dưới 100 ms khi metric Node khả dụng.
- PostgreSQL connections dưới 80% giới hạn cấu hình.
- Không có connection leak sau khi tải kết thúc.
- Không xuất hiện nhóm truy vấn mới có thời gian thực thi trên 1 giây và chiếm từ 1% tổng số truy vấn trở lên trong hold period.
- Trong vòng 5 phút sau spike, CPU, RAM, DB connections và p95 latency phải trở về trong biên ±10% so với median của baseline trước spike.

Nếu một metric chưa thể thu tự động trong giai đoạn đầu, báo cáo phải đánh dấu `not collected`; không được coi là đạt.

## 10. Định nghĩa capacity

**Maximum sustainable load** là bậc tải cao nhất duy trì được trong toàn hold period và thỏa mãn đồng thời:

- p95/p99 latency đạt budget tương ứng.
- Unexpected error và check failure đạt budget.
- Throughput tiếp tục tỷ lệ hợp lý với tải, chưa bước vào vùng saturation rõ rệt.
- CPU, RAM, event loop và DB chưa vượt safety threshold.
- Hệ thống phục hồi về gần baseline sau khi giảm tải.

Kết quả capacity phải ghi cả VU và achieved request rate; không được dùng VU đơn lẻ vì think time và journey mix ảnh hưởng tới RPS.

## 11. Pipeline CI/CD

### 11.1 Pull request

1. Build production.
2. Khởi động PostgreSQL test và seed fixture ổn định.
3. Khởi động Next.js production server.
4. Chạy k6 smoke.
5. Chạy Lighthouse CI trên trang trọng yếu.
6. Upload JSON/HTML/Markdown artifacts.
7. Dừng app và database test.

Hard threshold chặn merge. Metric dễ nhiễu có thể dùng median qua nhiều lượt hoặc cảnh báo regression lặp lại thay vì fail theo một mẫu đơn.

### 11.2 Nightly

1. Dựng môi trường nhất quán.
2. Chạy baseline và load ramp.
3. So sánh với baseline gần nhất trên cùng loại runner.
4. Cảnh báo khi p95 xấu hơn trên 15%, ngay cả khi chưa vượt hard budget.
5. Lưu artifacts và summary gắn với commit SHA.

Nightly CI không được tự động stress một URL bên ngoài danh sách staging cho phép.

### 11.3 Pre-release trên VPS production-like

1. Deploy đúng build artifact dự kiến phát hành.
2. Xác minh URL và environment marker của staging.
3. Reset/seed database staging riêng.
4. Chạy baseline, load, stress và spike theo thứ tự.
5. Thu VPS/PM2/PostgreSQL metrics đồng thời.
6. Chạy soak khi phạm vi thay đổi yêu cầu.
7. Sinh capacity report.
8. Cleanup fixture hoặc reset staging database.

## 12. Guardrails và an toàn dữ liệu

- Chỉ cho phép write/stress/spike khi `TARGET_ENV=staging` và có biến xác nhận riêng, ví dụ `ALLOW_DESTRUCTIVE_PERF_TESTS=1`.
- Từ chối chạy destructive suite nếu hostname không thuộc allowlist cấu hình.
- Không lưu username, password, cookie, token hoặc `.env.local` trong repository/artifact.
- Sử dụng tài khoản test và staging database riêng.
- Public write journey có rate cap và dữ liệu namespace theo run ID.
- Stress test có safety stop cho error rate, timeout và resource saturation kéo dài.
- Không chạy stress đồng thời với deploy, migration, backup hoặc job bảo trì.
- Production thật chỉ có thể nhận synthetic read-only nhẹ trong một hạng mục triển khai riêng sau này.

## 13. Thu thập và chuẩn hóa metrics

Mỗi lượt chạy đầy đủ phải thu được tối thiểu:

- k6 built-in metrics: duration, waiting, failed requests, iterations và VUs.
- Custom metrics theo endpoint group và journey.
- Lighthouse JSON/HTML.
- CPU, RAM và swap của VPS.
- Trạng thái PM2/process: restart count, memory và CPU.
- PostgreSQL active connections và slow-query evidence khi khả dụng.

Mọi timestamp phải có timezone rõ ràng. Summary phải ghi:

- Commit SHA.
- Environment và target URL đã làm sạch credential.
- Cấu hình máy/runner.
- Scenario, stages và journey mix.
- Build mode và phiên bản Node/k6/Lighthouse.

## 14. Artifacts và báo cáo

Mỗi lần chạy đầy đủ tạo:

- `summary.json`: dữ liệu máy đọc được.
- `report.md`: pass/fail, SLO, regression và capacity summary.
- Lighthouse HTML/JSON.
- Dữ liệu latency/throughput/error theo thời gian.
- Snapshot hoặc time series CPU/RAM/PM2/PostgreSQL.

Capacity report phải nêu:

- Knee point.
- Maximum sustainable VU và achieved RPS.
- Breaking point.
- Recovery time.
- Bottleneck chính kèm bằng chứng metric.
- Các metric không thu được và residual risk.

## 15. Xử lý lỗi của test harness

- Phân biệt rõ application failure, expected rejection và test infrastructure failure.
- Nếu seed, login hoặc fixture setup thất bại, dừng scenario thay vì tiếp tục với kết quả sai.
- Nếu không thu được system metrics trên VPS, bài HTTP test có thể hoàn thành nhưng capacity report phải ở trạng thái không đầy đủ.
- Nếu Lighthouse bị lỗi do browser/runner, không dùng điểm cũ thay thế.
- Script cleanup phải chạy trong bước `finally`/CI teardown, nhưng không được xóa dữ liệu ngoài namespace hoặc staging database đã xác minh.

## 16. Tiêu chí chấp nhận triển khai test harness

Bộ performance test được coi là hoàn thành khi:

- Có một lệnh được tài liệu hóa để chạy smoke suite trên local.
- PR smoke và Lighthouse chạy ổn định, xuất artifacts và áp dụng hard budget.
- Nightly load được tự động hóa và so sánh được với baseline cùng loại runner.
- Pre-release VPS suite có allowlist, environment marker và destructive-test guard.
- Các journey trọng yếu trong mục 6 được bao phủ.
- Threshold được version-control trong một nguồn cấu hình rõ ràng.
- Báo cáo cho biết commit, environment, workload và pass/fail.
- Có baseline production-like đầu tiên.
- Có capacity report xác định knee point, sustainable load, breaking point và bottleneck hoặc giải thích rõ metric còn thiếu.
- Tài liệu vận hành nêu cách chạy, cách đọc report, cách cập nhật baseline và cách xử lý test failure.

## 17. Lộ trình triển khai dự kiến

1. Tạo cấu trúc, budgets, cấu hình môi trường và guardrails.
2. Xây dựng journeys và smoke scenario.
3. Tích hợp Lighthouse CI.
4. Tạo report normalizer và artifacts.
5. Tích hợp PR pipeline.
6. Xây dựng load/stress/spike/soak scenarios.
7. Thu metrics VPS/PM2/PostgreSQL.
8. Tích hợp nightly và pre-release workflow.
9. Chạy baseline production-like đầu tiên và hiệu chỉnh budget qua review.

Chi tiết tác vụ, file cụ thể và lệnh xác minh sẽ được lập trong implementation plan sau khi bản spec này được người dùng duyệt.
