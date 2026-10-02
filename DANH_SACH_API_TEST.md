# DANH SÁCH TOÀN BỘ API TEST THỦ CÔNG - DỰ ÁN CAB SYSTEM
**Học phần:** Kiến trúc Microservices (MSA) - IUH  
**Sinh viên:** Mai Quốc Hưng - **MSSV:** 23732061  
**Base URL:** `http://localhost:3000/api/v1`  
**Cổng API Gateway:** `3000`

---

## I. THÔNG TIN ĐĂNG NHẬP & DỮ LIỆU TEST MẪU SẴN CÓ

| Vai trò | Username | Password | Mã định danh (ID) | Ghi chú |
|---|---|---|---|---|
| **Khách hàng** | `customer1` | `Password123@` | `usr_cust_001` | Role: `member` |
| **Quản trị viên** | `admin_hung` | `Password123@` | `usr_admin_001` | Role: `admin` |
| **Tài xế mẫu 1** | `driver_tuan` | `Password123@` | `DRV_001` | Status: `AVAILABLE` |
| **Tài xế mẫu 2** | `driver_nam` | `Password123@` | `DRV_002` | Status: `BUSY` |
| **Tài xế chờ duyệt** | - | - | `DRV_006` | Status: `PENDING_APPROVAL` |
| **Chuyến xe mẫu** | - | - | `ride_demo_001` | Dùng test Accept, Status, Payment |
| **Mã OTP mặc định** | - | - | `123456` | Dùng cho đăng ký tài xế |

---

## II. BẢNG TỔNG HỢP NHANH CÁC API THEO PHIẾU CHẤM (STT 1 - 30)

| STT | Tên Tiêu Chí | Method | Endpoint URL | Quyền / Header |
|:---:|---|:---:|---|---|
| **01** | Mô tả kiến trúc mã nguồn | `GET` | `/health` | Public |
| **02** | Kiểm tra .gitignore & .env | `GET` | `/health` | Public |
| **03** | Mô tả nhiệm vụ Gateway | `GET` | `/health` | Public |
| **04** | Mô tả IPC (gRPC & Kafka) | `GET` | `/health/services` | Public |
| **05** | Liệt kê danh sách Containers | `GET` | `/health/services` | Public |
| **06.1**| API Health Check: /health | `GET` | `/health` | Public |
| **06.2**| API Health Check: /ready | `GET` | `/ready` | Public |
| **06.3**| API Health Check: /health/services | `GET` | `/health/services` | Public |
| **07** | Kiểm tra hệ thống Kafka | `GET` | `/health/services` | Public |
| **08** | Kiểm tra request qua Gateway | `GET` | `/health` | Xem header `X-Correlation-Id` |
| **09** | Đăng ký tài khoản khách hàng | `POST` | `/auth/register` | Public |
| **10** | Đăng nhập khách hàng (Lấy JWT) | `POST` | `/auth/login` | Public |
| **11** | Lấy thông tin khách hàng theo ID | `GET` | `/customers/usr_cust_001` | Bearer Token Customer |
| **12** | Lấy thông tin tài xế theo ID | `GET` | `/drivers/DRV_001` | Bearer Token Customer |
| **13** | Liệt kê tài xế xung quanh 1km | `GET` | `/drivers/nearby?lat=10.8221&lng=106.6868&radius=1000&limit=5&page=1` | Bearer Token Customer |
| **14** | Danh sách booking của khách hàng | `GET` | `/bookings/customers/usr_cust_001/bookings?limit=5&page=1` | Bearer Token Customer |
| **15** | Đặt xe (Tạo booking & tìm tài xế) | `POST` | `/bookings` | Bearer Token Customer |
| **16** | Tài xế nhận chuyến xe | `POST` | `/bookings/ride_demo_001/accept` | Bearer Token Customer |
| **17.1**| Chuyến xe: Đến điểm đón | `PUT` | `/bookings/ride_demo_001/status` | Bearer Token Customer |
| **17.2**| Chuyến xe: Đang di chuyển | `PUT` | `/bookings/ride_demo_001/status` | Bearer Token Customer |
| **17.3**| Chuyến xe: Hoàn thành chuyến | `PUT` | `/bookings/ride_demo_001/status` | Bearer Token Customer |
| **18** | Hủy chuyến xe | `POST` | `/bookings/ride_demo_002/cancel` | Bearer Token Customer |
| **19.1**| Thanh toán online: Checkout | `POST` | `/payments/checkout` | Bearer Token Customer |
| **19.2**| Thanh toán online: Webhook callback | `POST` | `/payments/callback` | Public |
| **20** | Đánh giá chuyến đi (Rating) | `POST` | `/rides/ride_demo_001/rating` | Bearer Token Customer |
| **21.1**| Đăng ký tài xế: Nhận mã OTP | `POST` | `/auth/driver-otp/request` | Public |
| **21.2**| Đăng ký tài xế: Xác thực OTP | `POST` | `/auth/driver-otp/verify` | Public |
| **21.3**| Đăng ký tài xế: Nộp hồ sơ xe | `POST` | `/auth/register/driver` | Public |
| **22.1**| Duyệt hồ sơ: Đăng nhập Admin | `POST` | `/auth/login` | Public |
| **22.2**| Duyệt hồ sơ: Xem danh sách chờ duyệt| `GET` | `/admin/drivers` | Bearer Token Admin |
| **22.3**| Duyệt hồ sơ: Admin duyệt hồ sơ | `PUT` | `/admin/drivers/DRV_006/approval` | Bearer Token Admin |
| **23.1**| Bật nhận chuyến: Chuyển ONLINE | `PUT` | `/drivers/DRV_001/status` | Bearer Token Admin |
| **23.2**| Tắt nhận chuyến: Chuyển OFFLINE | `PUT` | `/drivers/DRV_001/status` | Bearer Token Admin |
| **24** | Data encryption at rest (Mã hóa DB) | `GET` | `/auth/security/encryption-check` | Public |
| **25** | SQL injection attempt (Chặn SQLi) | `POST` | `/auth/login` | Public |
| **26** | XSS input test (Lọc mã độc script) | `POST` | `/rides/ride_demo_001/rating` | Bearer Token Customer |
| **27** | JWT tampering (Chặn token sửa chữ ký)| `GET` | `/admin/drivers` | Bearer Token giả mạo |
| **28** | Phân quyền RBAC (Customer gọi Admin)| `PUT` | `/admin/drivers/DRV_001/approval` | Bearer Token Customer (Bị 403) |
| **29** | Rate limit attack (Spam đặt xe) | `POST` | `/bookings` | Bấm Send liên tục > 10 lần |
| **30** | Replay attack (Chống trừ tiền 2 lần)| `POST` | `/payments/checkout` | Gửi lặp lại cùng Idempotency-Key |

---

## III. CHI TIẾT REQUEST & DỮ LIỆU BODY TỪNG TIÊU CHÍ

### STT 06: API Health Check
* **06.1 - Health:**
  * **GET** `http://localhost:3000/api/v1/health`
  * Response mong đợi: `HTTP 200`, `status: "healthy"`
* **06.2 - Ready:**
  * **GET** `http://localhost:3000/api/v1/ready`
  * Response mong đợi: `HTTP 200`, `status: "ready"`
* **06.3 - Services Health:**
  * **GET** `http://localhost:3000/api/v1/health/services`
  * Response mong đợi: `HTTP 200`, danh sách 7 microservices đều `UP`.

---

### STT 08: Kiểm tra mọi request đều đi qua Gateway
* **GET** `http://localhost:3000/api/v1/health`
* **Kiểm tra Response Headers:**
  * `X-Correlation-Id`: `corr_...` (mã định danh duy nhất do Gateway sinh ra)
  * `RateLimit-Limit`: `1000` (giới hạn bảo vệ do Gateway quản lý)

---

### STT 09: Đăng ký tài khoản khách hàng
* **POST** `http://localhost:3000/api/v1/auth/register`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "username": "customer_moi_hung",
  "password": "Password123@",
  "role": "member"
}
```
* **Response mong đợi:** `HTTP 201 Created`

---

### STT 10: Đăng nhập khách hàng (Lấy Token)
* **POST** `http://localhost:3000/api/v1/auth/login`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "username": "customer1",
  "password": "Password123@"
}
```
* **Response mong đợi:** `HTTP 200 OK`, trả về chuỗi `data.token`.
> **Lưu ý:** Copy chuỗi token này để gắn vào header `Authorization: Bearer <token>` ở các request cần xác thực bên dưới.

---

### STT 11: Lấy thông tin khách hàng với mã số
* **GET** `http://localhost:3000/api/v1/customers/usr_cust_001`
* **Headers:**
  * `Authorization: Bearer <token_khách_hàng>`
* **Response mong đợi:** `HTTP 200 OK`, trả về thông tin khách hàng `customer1`.

---

### STT 12: Lấy thông tin tài xế với mã số
* **GET** `http://localhost:3000/api/v1/drivers/DRV_001`
* **Headers:**
  * `Authorization: Bearer <token_khách_hàng>`
* **Response mong đợi:** `HTTP 200 OK`, trả về tài xế `Nguyen Van Tuan`.

---

### STT 13: Liệt kê danh sách tài xế tại khu vực (1km, phân trang)
* **GET** `http://localhost:3000/api/v1/drivers/nearby?lat=10.8221&lng=106.6868&radius=1000&limit=5&page=1`
* **Headers:**
  * `Authorization: Bearer <token_khách_hàng>`
* **Response mong đợi:** `HTTP 200 OK`, danh sách các tài xế quanh tọa độ ĐH IUH (bán kính 1000m).

---

### STT 14: Liệt kê danh sách các booking của Customer
* **GET** `http://localhost:3000/api/v1/bookings/customers/usr_cust_001/bookings?limit=5&page=1`
* **Headers:**
  * `Authorization: Bearer <token_khách_hàng>`
* **Response mong đợi:** `HTTP 200 OK`, danh sách các chuyến xe đã đặt.

---

### STT 15: Đặt xe (Tạo booking & Tìm tài xế)
* **POST** `http://localhost:3000/api/v1/bookings`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <token_khách_hàng>`
* **Body (raw JSON):**
```json
{
  "customer_id": "usr_cust_001",
  "pickup_address": "12 Nguyễn Văn Bảo, Phường 4, Gò Vấp",
  "dropoff_address": "Sân bay Quốc tế Tân Sơn Nhất",
  "pickup_lat": 10.8221,
  "pickup_lng": 106.6868,
  "dropoff_lat": 10.8184,
  "dropoff_lng": 106.6588,
  "vehicle_type": "CAR_4_SEATS",
  "fare_amount": 85000
}
```
* **Response mong đợi:** `HTTP 201 Created`, trạng thái `requested`, tự động tìm tài xế gần nhất.

---

### STT 16: Tài xế nhận chuyến
* **POST** `http://localhost:3000/api/v1/bookings/ride_demo_001/accept`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <token_khách_hàng>`
* **Body (raw JSON):**
```json
{
  "driver_id": "DRV_001"
}
```
* **Response mong đợi:** `HTTP 200 OK`, chuyến xe được gán tài xế `DRV_001`, trạng thái `assigned`.

---

### STT 17: Cập nhật trạng thái chuyến xe (Theo trình tự)
* **Endpoint chung:** **PUT** `http://localhost:3000/api/v1/bookings/ride_demo_001/status`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <token_khách_hàng>`

1. **Bước 1 - Đến điểm đón:**
   ```json
   { "status": "ARRIVED" }
   ```
2. **Bước 2 - Bắt đầu di chuyển:**
   ```json
   { "status": "IN_PROGRESS" }
   ```
3. **Bước 3 - Hoàn thành chuyến:**
   ```json
   { "status": "COMPLETED" }
   ```

---

### STT 18: Hủy chuyến xe
* **POST** `http://localhost:3000/api/v1/bookings/ride_demo_002/cancel`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <token_khách_hàng>`
* **Body (raw JSON):**
```json
{
  "reason": "Khách hàng đổi ý, muốn đặt loại xe khác"
}
```
* **Response mong đợi:** `HTTP 200 OK`, trạng thái `cancelled`.

---

### STT 19: Thanh toán online
* **19.1 - Khởi tạo thanh toán (Checkout):**
  * **POST** `http://localhost:3000/api/v1/payments/checkout`
  * **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
  * **Body:**
  ```json
  {
    "ride_id": "ride_demo_001",
    "amount": 85000,
    "method": "online_banking",
    "customer_id": "usr_cust_001",
    "driver_id": "DRV_001"
  }
  ```
  * **Response:** Trả về `checkoutUrl` và `transactionId`.

* **19.2 - Webhook callback kết quả:**
  * **POST** `http://localhost:3000/api/v1/payments/callback`
  * **Headers:** `Content-Type: application/json`
  * **Body:**
  ```json
  {
    "payment_id": "pay_demo_001",
    "transaction_id": "TXN_DEMO_001",
    "status": "COMPLETED"
  }
  ```
  * **Response:** Trạng thái cập nhật thành `COMPLETED`.

---

### STT 20: Đánh giá chuyến đi (Rating)
* **POST** `http://localhost:3000/api/v1/rides/ride_demo_001/rating`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <token_khách_hàng>`
* **Body (raw JSON):**
```json
{
  "ride_id": "ride_demo_001",
  "stars": 5,
  "driver_id": "DRV_001",
  "comment": "Tài xế lái xe rất cẩn thận, 5 sao!"
}
```
* **Response mong đợi:** `HTTP 201 Created`.

---

### STT 21: Đăng ký tài xế (Luồng 3 bước)
1. **Bước 1: Yêu cầu gửi OTP:**
   * **POST** `http://localhost:3000/api/v1/auth/driver-otp/request`
   * **Body:** `{ "phone": "0987654321" }`
   * **Response:** Cấp mã OTP `123456`.
2. **Bước 2: Xác thực OTP:**
   * **POST** `http://localhost:3000/api/v1/auth/driver-otp/verify`
   * **Body:** `{ "phone": "0987654321", "otp": "123456" }`
   * **Response:** `verified: true`.
3. **Bước 3: Nộp hồ sơ xe:**
   * **POST** `http://localhost:3000/api/v1/auth/register/driver`
   * **Body:**
   ```json
   {
     "phone": "0987654321",
     "fullname": "Nguyễn Văn Hưng (Tài xế)",
     "vehicleType": "CAR_4_SEATS",
     "licensePlate": "51K-999.88"
   }
   ```
   * **Response:** `HTTP 201 Created`, trạng thái `PENDING_APPROVAL`.

---

### STT 22: Duyệt hồ sơ tài xế (Quản trị viên)
1. **Bước 1: Đăng nhập tài khoản Admin:**
   * **POST** `http://localhost:3000/api/v1/auth/login`
   * **Body:** `{ "username": "admin_hung", "password": "Password123@" }`
   * *(Copy chuỗi token của Admin gắn vào `Authorization: Bearer <token_admin>`)*.
2. **Bước 2: Xem danh sách hồ sơ:**
   * **GET** `http://localhost:3000/api/v1/admin/drivers`
   * **Header:** `Authorization: Bearer <token_admin>`
3. **Bước 3: Admin duyệt hồ sơ:**
   * **PUT** `http://localhost:3000/api/v1/admin/drivers/DRV_006/approval`
   * **Header:** `Authorization: Bearer <token_admin>`
   * **Body:** `{ "status": "APPROVED" }`
   * **Response:** Hồ sơ chuyển thành `APPROVED` (Trạng thái hoạt động `AVAILABLE`).

---

### STT 23: Bật/tắt trạng thái nhận chuyến
* **Endpoint:** **PUT** `http://localhost:3000/api/v1/drivers/DRV_001/status`
* **Header:** `Authorization: Bearer <token_admin>`
* **Body bật Online:** `{ "status": "AVAILABLE" }`
* **Body tắt Offline:** `{ "status": "OFFLINE" }`

---

### STT 24: Data encryption at rest (Mật khẩu được mã hóa trong DB)
* **GET** `http://localhost:3000/api/v1/auth/security/encryption-check`
* **Response mong đợi:** `HTTP 200 OK`, hiển thị các bản ghi mật khẩu trong PostgreSQL đều có dạng băm **BCrypt (`$2a$10$...`)**, hoàn toàn không lưu plaintext.

---

### STT 25: SQL injection attempt (Chặn đứng SQLi)
* **POST** `http://localhost:3000/api/v1/auth/login`
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "username": "' OR 1=1 --",
  "password": "anything"
}
```
* **Response mong đợi:** `HTTP 401 Unauthorized` (Query bị tham số hóa, không bị bypass).

---

### STT 26: XSS input test (Khử mã độc script)
* **POST** `http://localhost:3000/api/v1/rides/ride_demo_001/rating`
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token_khách_hàng>`
* **Body:**
```json
{
  "ride_id": "ride_demo_001",
  "stars": 5,
  "driver_id": "DRV_001",
  "comment": "Chuyến đi an toàn <script>alert('hack')</script>"
}
```
* **Response mong đợi:** `HTTP 201 Created`. Nhận xét trả về đã bị khử sạch thẻ script: `"comment": "Chuyến đi an toàn"`.

---

### STT 27: JWT tampering (Chặn token bị sửa chữ ký)
* **GET** `http://localhost:3000/api/v1/admin/drivers`
* **Headers:**
  * `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbl8wMDEiLCJyb2xlIjoiYWRtaW4ifQ.TAMPERED_FAKE_SIGNATURE_CAB_SYSTEM_2026`
* **Response mong đợi:** `HTTP 401 Unauthorized` (Lỗi: Chữ ký token không hợp lệ).

---

### STT 28: Unauthorized API access (Phân quyền RBAC)
* **PUT** `http://localhost:3000/api/v1/admin/drivers/DRV_001/approval`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <token_khách_hàng>` *(Dùng token role member)*
* **Body:** `{ "status": "REJECTED" }`
* **Response mong đợi:** `HTTP 403 Forbidden` (Khách hàng không có quyền truy cập API Admin).

---

### STT 29: Rate limit attack (Chống spam)
* **POST** `http://localhost:3000/api/v1/bookings`
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token_khách_hàng>`
* **Body:**
```json
{
  "customer_id": "usr_cust_001",
  "pickup_address": "12 Nguyễn Văn Bảo, Gò Vấp",
  "dropoff_address": "Sân bay Tân Sơn Nhất",
  "pickup_lat": 10.8221,
  "pickup_lng": 106.6868,
  "dropoff_lat": 10.8184,
  "dropoff_lng": 106.6588,
  "vehicle_type": "CAR_4_SEATS"
}
```
* **Thao tác:** Bấm nút **Send liên tục 11-12 lần thật nhanh** trong vòng 15 giây.
* **Response mong đợi:** Trả về `HTTP 429 Too Many Requests` (Rate limit kích hoạt bảo vệ hệ thống).

---

### STT 30: Replay attack (Idempotency - Chống trừ tiền 2 lần)
* **POST** `http://localhost:3000/api/v1/payments/checkout`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <token_khách_hàng>`
  * `Idempotency-Key: idem_replay_test_50k`
* **Body:**
```json
{
  "user_id": "usr_cust_001",
  "ride_id": "ride_demo_001",
  "amount": 50000
}
```
* **Thao tác:**
  1. Bấm **Send lần 1**: Hệ thống tạo bản ghi thanh toán mới với `transactionId` mới.
  2. Bấm **Send lần 2** (giữ nguyên Idempotency-Key và Body): Hệ thống trả lại đúng kết quả cũ với cùng `transactionId`, **KHÔNG tạo giao dịch mới, KHÔNG bị trừ tiền 2 lần**.
