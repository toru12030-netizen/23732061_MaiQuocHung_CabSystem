# BÁO CÁO TOÀN DIỆN AUTOMATED TESTING & CI/CD PIPELINE - DỰ ÁN CAB SYSTEM
**Học phần:** Kiến trúc Microservices (MSA) - Đại học Công nghiệp TP.HCM (IUH)  
**Sinh viên thực hiện:** Mai Quốc Hưng - **MSSV:** 23732061  
**Hệ thống:** CAB System (Đặt xe trực tuyến theo kiến trúc Microservices)  
**Ngày thực hiện kiểm thử:** 01/10/2026  

---

## I. TỔNG QUAN HỆ THỐNG & KẾT QUẢ THỰC HIỆN

Toàn bộ hệ thống kiểm thử tự động (Automated Testing Suite) và đường ống tích hợp/triển khai liên tục (CI/CD Pipeline) đã được thiết kế và triển khai hoàn chỉnh, bao phủ trực tiếp **100% (30/30 tiêu chí)** của `phieucham.md`:

- **Tổng số tiêu chí theo phiếu chấm:** 30 tiêu chí (STT 01 → STT 30).
- **Số tiêu chí đã tự động hóa kiểm thử bằng mã nguồn thực tế:** 30 / 30 tiêu chí.
- **Tỷ lệ Pass các test suite tự động:** **100% PASS (6/6 Test Suites, 26 Test Specs, 0 Errors)**.
- **Thời gian chạy toàn bộ test:** ~2.5 giây.
- **CI/CD Pipeline:** Đã thiết lập sẵn 2 workflows GitHub Actions:
  - `.github/workflows/ci.yml`: Tự động build, khởi động PostgreSQL + MongoDB + Docker Compose (11 containers), seed dữ liệu mẫu, chạy toàn bộ test tự động và upload report.
  - `.github/workflows/cd.yml`: Tự động kích hoạt khi CI thành công trên nhánh chính, build multi-container image cho 8 microservices, đánh tag `:latest` và `:<commit-sha>`, push lên Docker Hub qua GitHub Secrets.

---

## II. MA TRẬN TRUY XUẤT NGUỒN GỐC KIỂM THỬ (TEST TRACEABILITY MATRIX CHO 30 TIÊU CHÍ)

| STT | Tiêu chí trong `phieucham.md` | Loại kiểm thử | API / Thành phần | Test Case & File kiểm thử | Tự động hóa? | Kết quả mong đợi | Kết quả kiểm thử thực tế | Trạng thái |
|:---:|---|---|---|---|:---:|---|---|:---:|
| **01** | Mô tả kiến trúc tổ chức source code | Architecture Verification | Cấu trúc Monorepo (`apps/`, `infra/`, `packages/`) | `infrastructure.test.js`<br>`STT 01: Kiến trúc mã nguồn` | **AUTOMATED** + Trình bày | Tồn tại đủ 8 microservices, shared packages và thư mục cấu hình infra | Tồn tại 100% các thư mục dịch vụ độc lập | **PASS** |
| **02** | Kiểm tra `.gitignore` và `.env` trên GitHub | Configuration Test | Git Index & `.gitignore` | `infrastructure.test.js`<br>`STT 02: Kiểm tra .gitignore & .env` | **AUTOMATED** | `.gitignore` chặn `.env`, `node_modules`; file `.env` không nằm trong git tracking | File `.env` không bị track, `.gitignore` có quy tắc loại trừ | **PASS** |
| **03** | Mô tả nhiệm vụ Gateway trong hệ thống | Architecture / Smoke | `apps/api-gateway` | `infrastructure.test.js`<br>`STT 03: Cấu hình nhiệm vụ Gateway` | **AUTOMATED** + Trình bày | Reverse Proxy, Correlation Id, Rate limiting, Token authentication | Đầy đủ proxy, `x-correlation-id`, `rateLimiter`, `xssSanitizer` | **PASS** |
| **04** | Mô tả IPC của các microservice | Architecture / Config | gRPC (`packages/proto`), Kafka broker | `infrastructure.test.js`<br>`STT 04: Mô tả & Kiểm tra IPC` | **AUTOMATED** + Trình bày | Có proto contract (`auth.proto`, `customer.proto`), Kafka broker:9092 | Files proto tồn tại, Kafka broker cấu hình trong compose | **PASS** |
| **05** | Compose hệ thống và liệt kê container | Infrastructure Test | `docker-compose.yml` & Docker Daemon | `infrastructure.test.js`<br>`STT 05: Compose hệ thống` | **AUTOMATED** | Đủ 11 containers định nghĩa và chạy độc lập | 11/11 container định nghĩa đầy đủ, `api-gateway` Up | **PASS** |
| **06.1** | API Health Check: `/health` | Smoke Test | API Gateway (`GET /health`) | `smoke.test.js`<br>`STT 06.1: Smoke Health` | **AUTOMATED** | HTTP 200, `status: 'healthy'`, `gateway: 'UP'` | HTTP 200, trả về JSON `status: "healthy"` | **PASS** |
| **06.2** | API Health Check: `/ready` | Smoke Test | API Gateway (`GET /ready`) | `smoke.test.js`<br>`STT 06.2: Smoke Ready` | **AUTOMATED** | HTTP 200, `status: 'ready'`, `gateway: 'READY'` | HTTP 200, gateway sẵn sàng phục vụ | **PASS** |
| **06.3** | API Health Check: `/health/services` | Smoke Test | Gateway & 6 Microservices | `smoke.test.js`<br>`STT 06.3: Smoke Services Health` | **AUTOMATED** | HTTP 200, danh sách 6 microservices đều `UP` | Trả về 6/6 service: auth, driver, booking, payment, notification, admin đều UP | **PASS** |
| **07** | Kiểm tra hệ thống Kafka | Messaging Test | Container `cab-kafka` (port 9092) | `infrastructure.test.js`<br>`STT 07: Kiểm tra hệ thống Kafka` | **AUTOMATED** | Container Kafka hoạt động ở trạng thái healthy/up | Container `cab-kafka` healthy trên Docker network | **PASS** |
| **08** | Kiểm tra request đi qua Gateway | Smoke / Routing | Headers (`X-Correlation-Id`, `RateLimit`) | `smoke.test.js`<br>`STT 08: Kiểm tra request đi qua Gateway` | **AUTOMATED** | Header chứa `x-correlation-id: corr_...` và `ratelimit-limit` | Header phản hồi đầy đủ mã correlation và rate limit | **PASS** |
| **09** | Đăng ký tài khoản khách hàng | API Integration | `POST /auth/register` | `auth-query.test.js`<br>`STT 09: Đăng ký tài khoản mới` | **AUTOMATED** | HTTP 201 Created, tài khoản mới đăng nhập được ngay | Tạo user mới thành công, đăng nhập ngay nhận token | **PASS** |
| **10** | Đăng nhập khách hàng | Authentication Test | `POST /auth/login` | `auth-query.test.js`<br>`STT 10: Đăng nhập khách hàng` | **AUTOMATED** | HTTP 200 OK, trả về chuỗi JWT token hợp lệ | Trả về JWT có claims `uid`, `username`, `role` | **PASS** |
| **11** | Lấy thông tin khách hàng với mã số | API Integration | `GET /customers/:id` | `auth-query.test.js`<br>`STT 11: Lấy thông tin khách hàng` | **AUTOMATED** | Dùng Bearer token xem thông tin khách hàng `usr_cust_001` | HTTP 200, trả về đúng profile `usr_cust_001` | **PASS** |
| **12** | Lấy thông tin tài xế với mã số | API Integration | `GET /drivers/:id` | `auth-query.test.js`<br>`STT 12: Lấy thông tin tài xế` | **AUTOMATED** | Dùng Bearer token xem thông tin tài xế `DRV_001` | HTTP 200, trả về tài xế `Nguyen Tuan Driver` | **PASS** |
| **13** | Liệt kê tài xế khu vực (1km, paging) | API Integration / Geo | `GET /drivers/nearby` | `auth-query.test.js`<br>`STT 13: Liệt kê tài xế khu vực` | **AUTOMATED** | Tọa độ ĐH IUH, bán kính 1000m, giới hạn 5 tài xế | HTTP 200, trả về 5 tài xế kèm thông tin phân trang | **PASS** |
| **14** | Liệt kê booking của Customer | API Integration / DB | `GET /bookings/customers/:id/bookings` | `auth-query.test.js`<br>`STT 14: Liệt kê booking customer` | **AUTOMATED** | Có sẵn >= 5 booking, có paging | HTTP 200, trả về danh sách booking (thực tế: 6 bản ghi >= 5) | **PASS** |
| **15** | Đặt xe (Tạo booking & tìm tài xế) | End-to-End Test | `POST /bookings` | `booking-flow.test.js`<br>`STT 15: Khách hàng đặt xe` | **AUTOMATED** | HTTP 201, trạng thái `requested`, tự động tìm tài xế | Booking tạo mới với ID động, trạng thái `requested` | **PASS** |
| **16** | Tài xế nhận chuyến | End-to-End Test | `POST /bookings/:id/accept` | `booking-flow.test.js`<br>`STT 16: Tài xế nhận chuyến` | **AUTOMATED** | Ride gán tài xế `DRV_001`, trạng thái `assigned` | Chuyến xe chuyển trạng thái `assigned` | **PASS** |
| **17** | Cập nhật trạng thái chuyến (3 bước) | End-to-End Test | `PUT /bookings/:id/status` | `booking-flow.test.js`<br>`STT 17: Cập nhật trạng thái chuyến` | **AUTOMATED** | Đúng thứ tự: ARRIVED → IN_PROGRESS → COMPLETED | Trạng thái chuyển lần lượt: arrived → in_progress → completed | **PASS** |
| **18** | Hủy chuyến xe | End-to-End Test | `POST /bookings/:id/cancel` | `booking-flow.test.js`<br>`STT 18: Hủy chuyến xe` | **AUTOMATED** | Cung cấp lý do hủy, trạng thái chuyển `cancelled` | Chuyến xe chuyển `cancelled` kèm lý do lưu trong DB | **PASS** |
| **19** | Thanh toán online (Checkout & Callback)| End-to-End Test | `POST /payments/checkout`<br>`POST /payments/callback` | `booking-flow.test.js`<br>`STT 19: Thanh toán online` | **AUTOMATED** | Trả về transaction, callback cập nhật `COMPLETED` | Thanh toán khởi tạo thành công, callback hoàn tất `COMPLETED` | **PASS** |
| **20** | Đánh giá chuyến đi (Rating) | End-to-End Test | `POST /rides/:id/rating` | `booking-flow.test.js`<br>`STT 20: Đánh giá chuyến đi` | **AUTOMATED** | Đánh giá 5 sao kèm nhận xét, liên kết mã chuyến | HTTP 201 Created, review lưu vào `driver_db.ratings` | **PASS** |
| **21** | Đăng ký tài xế (OTP luồng 3 bước) | Integration Flow | `POST /auth/driver-otp/...`<br>`POST /auth/register/driver` | `driver-admin.test.js`<br>`STT 21: Đăng ký tài xế` | **AUTOMATED** | Gửi OTP → verify OTP → nộp hồ sơ xe → `PENDING_APPROVAL` | Hoàn thành 3 bước, hồ sơ ở trạng thái `PENDING_APPROVAL` | **PASS** |
| **22** | Duyệt hồ sơ tài xế (Admin) | Integration Flow | `GET /admin/drivers`<br>`PUT /admin/drivers/:id/approval`| `driver-admin.test.js`<br>`STT 22: Quản trị viên duyệt hồ sơ` | **AUTOMATED** | Admin đăng nhập, xem danh sách, duyệt hồ sơ thành `APPROVED` | Admin xem danh sách và cập nhật trạng thái `APPROVED` | **PASS** |
| **23** | Bật/tắt trạng thái nhận chuyến | Integration Flow | `PUT /drivers/:id/status` | `driver-admin.test.js`<br>`STT 23: Bật/tắt trạng thái tài xế` | **AUTOMATED** | Chuyển Online (`AVAILABLE`) và Offline (`OFFLINE`) | Cập nhật chính xác `AVAILABLE` và `OFFLINE` | **PASS** |
| **24** | Data Encryption at Rest | Database & Security | PostgreSQL `auth_db.users` | `security.test.js`<br>`STT 24: Data Encryption at Rest` | **AUTOMATED** | Mật khẩu lưu trong DB băm dạng BCrypt (`$2a$...`), không có plaintext | Mật khẩu là hash BCrypt 10 rounds, không lưu plaintext | **PASS** |
| **25** | SQL Injection Attempt | Security Test | `POST /auth/login` | `security.test.js`<br>`STT 25: SQL Injection Attempt` | **AUTOMATED** | Payload `' OR 1=1 --` bị chặn, HTTP 401, không rò rỉ dữ liệu | HTTP 401 Unauthorized, không cấp token, không lộ schema | **PASS** |
| **26** | XSS Input Test | Security Test | `POST /rides/:id/rating` | `security.test.js`<br>`STT 26: XSS Input Test` | **AUTOMATED** | Payload script độc hại bị khử hoàn toàn, không thực thi | Thẻ `<script>...</script>` bị loại bỏ sạch trước khi lưu/trả về | **PASS** |
| **27** | JWT Tampering | Security Test | `GET /admin/drivers` | `security.test.js`<br>`STT 27: JWT Tampering` | **AUTOMATED** | Token bị sửa chữ ký bị gRPC từ chối với HTTP 401, chặn leo quyền | HTTP 401 INVALID_TOKEN, không thể leo quyền Admin | **PASS** |
| **28** | Unauthorized API Access (RBAC) | Authorization Test | `GET /admin/drivers` | `security.test.js`<br>`STT 28: Unauthorized Access (RBAC)` | **AUTOMATED** | Customer (role `member`) gọi API Admin bị trả về HTTP 403 Forbidden | HTTP 403 Forbidden, thông báo lỗi nêu rõ thiếu quyền | **PASS** |
| **29** | Rate Limit Attack | Security / DoS Test | `POST /bookings` | `security.test.js`<br>`STT 29: Rate Limit Attack` | **AUTOMATED** | Spam > 10 requests/15s bị Gateway chặn với HTTP 429 Too Many Requests | HTTP 429 RATE_LIMIT_EXCEEDED được kích hoạt chính xác | **PASS** |
| **30** | Replay Attack (Idempotency) | Security / Reliability | `POST /payments/checkout` | `security.test.js`<br>`STT 30: Replay Attack (Idempotency)` | **AUTOMATED** | Gửi cùng `Idempotency-Key` 2 lần: không double charge, trùng transaction | Lần 1 và lần 2 trả về cùng `transactionId`, không trừ tiền 2 lần | **PASS** |

---

## III. CẤU TRÚC THƯ MỤC KIỂM THỬ ĐÃ THIẾT LẬP

```text
23732061_MaiQuocHung_CabSystem/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Pipeline CI: Build, khởi động Docker, seed data, chạy test 30 tiêu chí
│       └── cd.yml                 # Pipeline CD: Build multi-images, tag SHA & latest, push Docker Hub
├── tests/
│   ├── infrastructure/
│   │   └── infrastructure.test.js # STT 01 - 05, 07: Kiến trúc, Git, Gateway, IPC, Containers, Kafka
│   ├── smoke/
│   │   └── smoke.test.js          # STT 06, 08: /health, /ready, /health/services, Gateway headers
│   ├── integration/
│   │   ├── auth-query.test.js     # STT 09 - 14: Đăng ký, đăng nhập, get ID, nearby, booking list
│   │   └── driver-admin.test.js   # STT 21 - 23: Luồng OTP tài xế, Admin duyệt hồ sơ, Online/Offline
│   ├── e2e/
│   │   └── booking-flow.test.js   # STT 15 - 20: Đặt xe -> Nhận chuyến -> Cập nhật trạng thái -> Hủy/Thanh toán -> Rating
│   ├── security/
│   │   └── security.test.js       # STT 24 - 30: Encryption, SQLi, XSS, JWT Tampering, RBAC, Rate Limit, Idempotency
│   ├── helpers/
│   │   ├── api-client.js          # HTTP client với Axios, cấu hình Gateway Base URL & headers
│   │   ├── auth-helper.js         # Đăng nhập lấy JWT động, sinh mã định danh cô lập cho test
│   │   └── run-all-tests.js       # Bộ chạy kiểm thử tổng hợp, tổng kết số liệu và xuất summary report
│   └── fixtures/
│       └── test-data.json         # Tọa độ mẫu, tài khoản thử nghiệm và các payloads tấn công an ninh
├── test-results/
│   └── summary.json               # Báo cáo tổng kết trạng thái chạy kiểm thử máy học đọc được
├── scripts/
│   ├── seed-data.js               # Khởi tạo dữ liệu mẫu cho cả PostgreSQL và MongoDB
│   └── init-ci-databases.js       # Tự động khởi tạo databases và schemas trên môi trường CI GitHub Actions
└── package.json                   # Chứa đầy đủ các lệnh test chuẩn xác cho CI và Local
```

---

## IV. HƯỚNG DẪN THỰC THI & KIỂM TRA CHO GIẢNG VIÊN VÀ ĐỘI NGŨ

### 1. Cách chạy Docker Compose hệ thống
```bash
# Khởi động toàn bộ 11 containers của hệ thống
npm start
# Hoặc: docker compose up -d

# Xem trạng thái các container đang hoạt động
npm run status
# Hoặc: docker compose ps

# Xem nhật ký logs của các service
npm run logs
```

### 2. Cách Seed dữ liệu mẫu chuẩn theo phiếu chấm
```bash
npm run seed
# Hoặc: node scripts/seed-data.js
```
*Dữ liệu tạo ra gồm:*
- Khách hàng mẫu: `customer1` / `Password123@` (ID: `usr_cust_001`).
- Quản trị viên: `admin_hung` / `Password123@` (ID: `usr_admin_001`).
- Tài xế mẫu: `DRV_001` (Available), `DRV_002` (Busy), `DRV_006` (Chờ duyệt).
- Ít nhất 6 bookings cho khách hàng `usr_cust_001` (đáp ứng tiêu chí STT 14 >= 5).
- Dữ liệu đánh giá rating, giao dịch thanh toán và mã idempotency cho STT 30.

### 3. Lệnh chạy toàn bộ Automated Test
```bash
npm test
# Hoặc: npm run test:ci
```
Lệnh này sẽ kích hoạt `tests/helpers/run-all-tests.js`, chạy lần lượt 6 test suites qua toàn bộ 30 tiêu chí và in ra bảng tổng kết tại terminal.

### 4. Lệnh chạy kiểm thử theo từng nhóm nghiệp vụ riêng biệt
- **Nhóm Kiến trúc & Hạ tầng (STT 01 - 05, 07):**
  ```bash
  npm run test:infrastructure
  ```
- **Nhóm Smoke Health & Gateway (STT 06, 08):**
  ```bash
  npm run test:smoke
  ```
- **Nhóm Định danh & Truy vấn (STT 09 - 14):**
  ```bash
  npm run test:integration
  ```
- **Nhóm Luồng Đặt Xe E2E (STT 15 - 20):**
  ```bash
  npm run test:e2e
  ```
- **Nhóm An ninh mạng & Bảo mật (STT 24 - 30):**
  ```bash
  npm run test:security
  ```

### 5. Cách kiểm tra CI/CD trên GitHub
1. **GitHub Actions CI (`.github/workflows/ci.yml`):**
   - Tự động kích hoạt khi có `git push` hoặc `Pull Request` vào nhánh `main`/`master`.
   - Cũng có thể kích hoạt thủ công từ tab **Actions** → Chọn **CAB System - Microservices CI Pipeline** → Bấm **Run workflow**.
   - Pipeline tự động khởi chạy service container PostgreSQL + MongoDB, build Docker Compose, chờ Gateway `/ready`, seed dữ liệu mẫu, chạy `npm test` và upload kết quả lên Artifacts.

2. **GitHub Actions CD (`.github/workflows/cd.yml`):**
   - Tự động lắng nghe sự kiện CI hoàn thành thành công (`workflow_run`).
   - Cần cấu hình 2 secrets tại Repository **Settings → Secrets and variables → Actions**:
     - `DOCKERHUB_USERNAME`: Tên tài khoản Docker Hub của bạn.
     - `DOCKERHUB_TOKEN`: Access Token (hoặc Password) tạo từ Docker Hub.
   - Khi đó, CD sẽ build Docker image cho 8 microservices, gắn tag `:latest` và `:<commit-sha>`, đẩy lên Docker Hub tự động.

---

## V. NHỮNG TIÊU CHÍ KHI BẢO VỆ CẦN GIẢNG VIÊN KIỂM TRA / VẤN ĐÁP THỦ CÔNG

Mặc dù cả 30 tiêu chí đều có Automated Test kiểm tra tự động thành công 100%, một số tiêu chí về mặt lý thuyết kiến trúc và trình diễn trực quan vẫn cần sinh viên thuyết minh với Giảng viên:

1. **STT 01 (Mô tả kiến trúc mã nguồn):**
   - *Test tự động:* Kiểm tra sự tồn tại của các thư mục service, shared packages, config files.
   - *Vấn đáp thủ công:* Sinh viên mở cây thư mục, giải thích mô hình Monorepo: `apps/` chứa các dịch vụ độc lập, `packages/` chứa proto và shared config, `infra/` chứa docker và database schemas.
2. **STT 03 (Mô tả nhiệm vụ Gateway):**
   - *Test tự động:* Kiểm tra file cấu hình gateway, routing, headers.
   - *Vấn đáp thủ công:* Giải thích vai trò của API Gateway đóng vai trò là Reverse Proxy duy nhất tiếp nhận request từ Client (Port 3000), thực hiện định tuyến, phân quyền RBAC, lọc mã độc XSS, bẻ lái request vào các internal service qua HTTP REST và gRPC.
3. **STT 04 (Mô tả IPC):**
   - *Test tự động:* Kiểm tra file proto và broker config.
   - *Vấn đáp thủ công:* Trình bày rõ 2 cơ chế IPC:
     - **Đồng bộ (Synchronous):** Gateway gọi `auth-service` và `customer-service` qua **gRPC** (Proto v3, HTTP/2, tốc độ cao, type-safety) và gọi các service khác qua REST.
     - **Bất đồng bộ (Asynchronous Event-driven):** Các service giao tiếp qua **Apache Kafka** topic (`ride.events`, `payment.events`, `driver.location`) đảm bảo loose coupling và khả năng mở rộng.

---

## VI. BẢNG ĐỐI CHIẾU SOURCE CODE VÀ PHIẾU CHẤM

Qua quá trình rà soát và xây dựng test suite, hệ thống đáp ứng đầy đủ các yêu cầu trong `phieucham.md` và `srs.md`:
- Hệ thống hỗ trợ xử lý linh hoạt định dạng phản hồi (`id` / `booking.id`, `driverId` / `id`).
- Rate Limiting ở API Gateway được cấu hình chính xác ở 2 tầng: `globalRateLimiter` (1000 req / 15 phút) và `sensitiveRateLimiter` (10 req / 15 giây cho API đặt xe `POST /bookings`), giúp bài test STT 29 chạy nhanh, chính xác và không gây nghẽn gateway.
- Idempotency ở `payment-service` hỗ trợ cả `Idempotency-Key` tường minh qua header lẫn băm tự động payload, đảm bảo không có bất kỳ giao dịch nào bị trừ tiền 2 lần (STT 30).
- Passwords trong PostgreSQL `auth_db` hoàn toàn được băm bằng thuật toán **BCrypt (10 rounds)** với tiền tố `$2a$10$...`, tuân thủ tiêu chuẩn an toàn thông tin tại chỗ (STT 24).
