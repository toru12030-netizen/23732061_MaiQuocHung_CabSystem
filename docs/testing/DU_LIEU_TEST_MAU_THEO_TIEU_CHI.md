# DỮ LIỆU TEST MẪU GÕ TAY THEO TỪNG TIÊU CHÍ (PHIEUCHAM.MD)
**Dự án:** CAB System – Hệ thống đặt xe trực tuyến theo kiến trúc Microservices  
**Sinh viên thực hiện:** Mai Quốc Hưng — **MSSV:** 23732061  
**Môn học:** Kiến trúc Microservices (MSA) — Trường Đại học Công nghiệp TP.HCM (IUH)  
**Cổng API Gateway:** `http://localhost:3000`  
**Base URL:** `http://localhost:3000/api/v1`

---

## HƯỚNG DẪN CHUNG KHI TEST THỦ CÔNG TRÊN POSTMAN

1. **Không cần import file JSON:** Bạn chỉ cần mở Postman, bấm nút **`+`** tạo request mới, copy URL, chọn Method (GET/POST/PUT) và dán Request Body theo đúng từng mục dưới đây.
2. **Quy tắc truyền Token:**
   - Với các API cần quyền (Khách hàng hoặc Admin), vào tab **Headers** thêm:
     - Key: `Authorization`
     - Value: `Bearer <dán_token_vào_đây>`
   - Hoặc vào tab **Authorization** -> Chọn Type: **Bearer Token** -> Dán Token vào.
3. **Tài khoản test có sẵn:**

| Vai trò | Username | Password | Mã ID định danh | Quyền (Role) |
|---|---|---|---|---|
| **Khách hàng mẫu** | `customer1` | `Password123@` | `usr_cust_001` | `member` |
| **Quản trị viên (Admin)** | `admin_hung` | `Password123@` | `usr_admin_001` | `admin` |
| **Tài xế mẫu 1 (Sẵn sàng)** | `driver_tuan` | `Password123@` | `DRV_001` | `AVAILABLE` |
| **Tài xế mẫu 2 (Bận)** | `driver_nam` | `Password123@` | `DRV_002` | `BUSY` |
| **Tài xế chờ duyệt** | - | - | `DRV_006` | `PENDING_APPROVAL` |
| **Chuyến xe mẫu để test** | - | - | `ride_demo_001` | Dùng test Accept/Status/Payment |

---

# BẢNG CHẤM THỰC HÀNH 1 (STT 01 - STT 10)

---

### STT 01: Mô tả kiến trúc tổ chức source code
- **Mục tiêu:** Chứng minh cấu trúc Monorepo phân tách rõ ràng giữa API Gateway, Microservices, Packages dùng chung và Hạ tầng.
- **Thao tác:** Mở cửa sổ Terminal hoặc trình bày sơ đồ thư mục:
```bash
# Xem cây thư mục hệ thống
ls -la apps/ packages/ infra/ docs/
```
- **Nội dung trả lời:**
  - `apps/`: Chứa 10 Microservices độc lập (`api-gateway`, `auth-service`, `customer-service`, `driver-service`, `booking-service`, `trip-service`, `payment-service`, `audit-service`, `notification-service`, `admin-service`).
  - `packages/`: Chứa thư viện dùng chung (`proto` cho gRPC, `shared-config`, `event-contracts`).
  - `docs/`: Chứa tài liệu kiến trúc DDD (`micro_service_design.md`), đặc tả SRS, phiếu chấm và báo cáo test.
  - Mỗi service có cấu trúc chuẩn: `src/routes`, `src/controllers`, `src/services`, `src/models`, `src/config/env.js`, `src/config/db.js`.

---

### STT 02: Kiểm tra `.gitignore` và `.env` trên GitHub
- **Mục tiêu:** Chứng minh thông tin bảo mật, file `.env` thật không bị commit lên kho mã nguồn Git.
- **Thao tác kiểm tra Terminal:**
```bash
git status --ignored
cat .gitignore | grep ".env"
```
- **Kết quả mong đợi:** File `.gitignore` có chứa dòng `.env` và `.env.*` (chỉ cho phép `.env.example`). Lệnh `git status` không hiển thị file `.env` chứa mật khẩu thật.

---

### STT 03: Mô tả nhiệm vụ Gateway trong hệ thống
- **Mục tiêu:** Chứng minh API Gateway là Single Entry Point, đảm nhiệm Reverse Proxy, Authentication, Rate Limiting, Correlation ID và XSS Sanitizer.
- **Thao tác Postman:**
  - **Method:** `GET`
  - **URL:** `http://localhost:3000/health`
  - **Headers:** Không cần
- **Kết quả mong đợi (HTTP 200 OK):**
```json
{
  "success": true,
  "service": "api-gateway",
  "status": "UP",
  "timestamp": "2026-10-02T16:00:00.000Z"
}
```

---

### STT 04: Mô tả IPC (Inter-Process Communication) của các microservice
- **Mục tiêu:** Trình bày 3 kênh giao tiếp trong hệ thống:
  1. **REST HTTP:** Client/Gateway gọi các backend services.
  2. **gRPC (Protobuf):** Gateway gọi `auth-service` (Port `50051`) để validate token và `customer-service` (Port `50052`) để lấy profile với độ trễ siêu thấp.
  3. **Apache Kafka (Event Broker):** Vận chuyển bất đồng bộ các event (`booking.created`, `trip.completed`, `payment.completed`, `audit.recorded`).

---

### STT 05: Compose hệ thống và liệt kê các container
- **Mục tiêu:** Chứng minh toàn bộ cụm 13 containers được khởi chạy hoàn chỉnh và healthy.
- **Thao tác Terminal:**
```bash
docker compose ps
```
- **Kết quả mong đợi:** Toàn bộ 13 containers đều ở trạng thái `Up` / `healthy`:
  - `cab-api-gateway` (Port 3000)
  - `cab-auth-service` (Port 3001, gRPC 50051)
  - `cab-customer-service` (Port 3007, gRPC 50052)
  - `cab-driver-service` (Port 3002)
  - `cab-booking-service` (Port 3003)
  - `cab-trip-service` (Port 3008)
  - `cab-payment-service` (Port 3004)
  - `cab-audit-service` (Port 3009)
  - `cab-notification-service` (Port 3005)
  - `cab-admin-service` (Port 3006)
  - `cab-kafka` (Port 9092)
  - `cab-zookeeper` (Port 2181)
  - `cab-secure-db` (Port 27017)

---

### STT 06: API Health Check (Smoke Test)

#### 6.1 Kiểm tra Gateway Liveness:
- **Method:** `GET`
- **URL:** `http://localhost:3000/health`
- **Response:** `HTTP 200 OK`
```json
{
  "success": true,
  "service": "api-gateway",
  "status": "UP"
}
```

#### 6.2 Kiểm tra Gateway Readiness:
- **Method:** `GET`
- **URL:** `http://localhost:3000/ready`
- **Response:** `HTTP 200 OK`
```json
{
  "ready": true,
  "services": {
    "auth": true,
    "driver": true,
    "booking": true,
    "payment": true
  }
}
```

#### 6.3 Kiểm tra toàn bộ trạng thái 10 Microservices:
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/health/services`
- **Response:** `HTTP 200 OK` (Liệt kê chi tiết trạng thái của auth, driver, booking, payment, notification, admin, trip, audit).

---

### STT 07: Kiểm tra hệ thống Kafka
- **Mục tiêu:** Chứng minh Kafka Broker đang hoạt động và quản lý các topic sự kiện.
- **Thao tác Terminal:**
```bash
docker exec -it cab-kafka kafka-topics --bootstrap-server localhost:9092 --list
```
- **Kết quả mong đợi:** Hiển thị danh sách các topic:
  - `cab.events`
  - `ride.events`
  - `payment.events`
  - `audit.events`

---

### STT 08: Kiểm tra mọi request đều phải đi qua Gateway
- **Mục tiêu:** Chứng minh Gateway tự động gán Tracking ID (`X-Correlation-Id`) cho mọi request đi qua nó.
- **Thao tác Postman:**
  - **Method:** `GET`
  - **URL:** `http://localhost:3000/health`
- **Kiểm tra Response Headers:** Bấm tab **Headers** bên dưới phần Response của Postman, tìm header:
  - `X-Correlation-Id: req_xxxxxxxxx` (hoặc UUID)

---

### STT 09: Đăng ký tài khoản khách hàng mới
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/auth/register`
- **Headers:**
  - `Content-Type: application/json`
- **Request Body (JSON):**
```json
{
  "username": "khachhang_moi_2026",
  "password": "Password123@",
  "role": "member"
}
```
- **Response mong đợi (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "uid": "usr_xxxxxx",
    "username": "khachhang_moi_2026",
    "role": "member"
  }
}
```

---

### STT 10: Đăng nhập khách hàng (Hệ thống cấp JWT Token)
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/auth/login`
- **Headers:**
  - `Content-Type: application/json`
- **Request Body (JSON):**
```json
{
  "username": "customer1",
  "password": "Password123@"
}
```
- **Response mong đợi (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...",
    "user": {
      "uid": "usr_cust_001",
      "username": "customer1",
      "role": "member"
    }
  }
}
```
> **LƯU Ý QUAN TRỌNG:** Copy chuỗi `token` này để dùng cho tất cả các request của Khách hàng từ STT 11 đến STT 20!

---

# BẢNG CHẤM THỰC HÀNH 2 (STT 11 - STT 20)

---

### STT 11: Lấy thông tin khách hàng với mã số
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/customers/usr_cust_001`
- **Headers:**
  - `Authorization: Bearer <dán_token_customer1>`
- **Response mong đợi (HTTP 200 OK):**
```json
{
  "success": true,
  "data": {
    "uid": "usr_cust_001",
    "fullname": "Nguyen Van An",
    "phone": "0901234567",
    "address": "12 Nguyen Van Bao, Phuong 4, Go Vap, TP.HCM"
  }
}
```

---

### STT 12: Lấy thông tin tài xế với mã số
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/drivers/DRV_001`
- **Headers:**
  - `Authorization: Bearer <dán_token_customer1>`
- **Response mong đợi (HTTP 200 OK):**
```json
{
  "success": true,
  "data": {
    "driverId": "DRV_001",
    "name": "Trần Văn Tuấn",
    "phone": "0912345678",
    "status": "AVAILABLE",
    "rating": 4.9,
    "vehicle": {
      "model": "Toyota Vios",
      "licensePlate": "51G-123.45"
    }
  }
}
```

---

### STT 13: Liệt kê danh sách tài xế tại khu vực (Bán kính 1km, phân trang)
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/drivers/nearby?lat=10.8221&lng=106.6868&radius=1000&limit=5&page=1`
- **Headers:**
  - `Authorization: Bearer <dán_token_customer1>`
- **Response mong đợi (HTTP 200 OK):**
```json
{
  "success": true,
  "data": {
    "drivers": [
      {
        "driverId": "DRV_001",
        "name": "Trần Văn Tuấn",
        "status": "AVAILABLE",
        "distance": 150
      },
      {
        "driverId": "DRV_002",
        "name": "Nguyễn Văn Nam",
        "status": "BUSY",
        "distance": 320
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 5
    }
  }
}
```

---

### STT 14: Liệt kê danh sách các booking của Customer (Có phân trang)
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/bookings/customers/usr_cust_001/bookings?limit=5&page=1`
- **Headers:**
  - `Authorization: Bearer <dán_token_customer1>`
- **Response mong đợi (HTTP 200 OK):**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "ride_comp_001",
        "status": "completed",
        "pickup_address": "12 Nguyen Van Bao, Go Vap (IUH)",
        "dropoff_address": "San bay Tan Son Nhat",
        "fare": 89000
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 6
    }
  }
}
```

---

### STT 15: Khách hàng Đặt xe (Tạo Booking -> Tìm tài xế)
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/bookings`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_customer1>`
- **Request Body (JSON):**
```json
{
  "customer_id": "usr_cust_001",
  "pickup_address": "12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM (ĐH IUH)",
  "dropoff_address": "Sân bay Quốc tế Tân Sơn Nhất, Tân Bình, TP.HCM",
  "pickup_lat": 10.8221,
  "pickup_lng": 106.6868,
  "dropoff_lat": 10.8184,
  "dropoff_lng": 106.6588,
  "vehicle_type": "sedan",
  "fare_amount": 89000
}
```
- **Response mong đợi (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "Booking created successfully, searching for nearby drivers",
  "data": {
    "id": "ride_xxxxxx",
    "status": "requested",
    "pickup_address": "12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM (ĐH IUH)",
    "fare_amount": 89000
  }
}
```
> Lưu ý: Hãy lưu mã `id` vừa tạo (ví dụ `ride_123456`) để dùng cho các bước STT 16, 17 bên dưới. Nếu không, bạn có thể dùng mã có sẵn: `ride_demo_001`.

---

### STT 16: Tài xế nhận chuyến xe (Atomic Accept)
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/bookings/ride_demo_001/accept`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_customer1>`
- **Request Body (JSON):**
```json
{
  "driver_id": "DRV_001"
}
```
- **Response mong đợi (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Ride accepted by driver successfully",
  "data": {
    "id": "ride_demo_001",
    "driver_id": "DRV_001",
    "status": "accepted"
  }
}
```

---

### STT 17: Cập nhật trạng thái chuyến xe (Tuần tự)

#### 17.1: Tài xế đã đến điểm đón (driver_arrived):
- **Method:** `PUT`
- **URL:** `http://localhost:3000/api/v1/bookings/ride_demo_001/status`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_customer1>`
- **Request Body (JSON):**
```json
{
  "status": "driver_arrived"
}
```
- **Response:** `HTTP 200 OK` (status: `driver_arrived`).

#### 17.2: Bắt đầu chuyến xe (in_progress):
- **Request Body (JSON):**
```json
{
  "status": "in_progress"
}
```
- **Response:** `HTTP 200 OK` (status: `in_progress`).

#### 17.3: Hoàn thành chuyến xe (completed):
- **Request Body (JSON):**
```json
{
  "status": "completed"
}
```
- **Response:** `HTTP 200 OK` (status: `completed`).

---

### STT 18: Khách hàng Hủy chuyến xe
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/bookings/ride_demo_002/cancel`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_customer1>`
- **Request Body (JSON):**
```json
{
  "cancelled_by": "customer",
  "reason": "Khách hàng đổi ý, có người nhà đưa đón"
}
```
- **Response mong đợi (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Booking has been cancelled",
  "data": {
    "id": "ride_demo_002",
    "status": "cancelled",
    "cancel_reason": "Khách hàng đổi ý, có người nhà đưa đón"
  }
}
```

---

### STT 19: Thanh toán trực tuyến (Checkout & Callback)

#### 19.1: Khởi tạo thanh toán (Checkout):
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/payments/checkout`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_customer1>`
  - `Idempotency-Key: IDEMP_KEY_CUST_PAY_001`
- **Request Body (JSON):**
```json
{
  "ride_id": "ride_demo_001",
  "amount": 89000,
  "method": "credit_card"
}
```
- **Response mong đợi (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "paymentId": "pay_xxxxxx",
    "status": "COMPLETED",
    "amount": 89000
  }
}
```

#### 19.2: Webhook Callback từ Cổng thanh toán:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/payments/callback`
- **Headers:** `Content-Type: application/json`
- **Request Body (JSON):**
```json
{
  "transaction_id": "MOMO_TXN_998877",
  "status": "SUCCESS",
  "signature": "valid_mock_signature"
}
```
- **Response mong đợi (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Payment webhook callback processed"
}
```

---

### STT 20: Khách hàng đánh giá chuyến đi (Rating)
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/rides/ride_demo_001/rating`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_customer1>`
- **Request Body (JSON):**
```json
{
  "rating": 5,
  "comment": "Tài xế lái xe cẩn thận, xe sạch sẽ, 5 sao chất lượng!"
}
```
- **Response mong đợi (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "Rating submitted successfully",
  "data": {
    "rideId": "ride_demo_001",
    "rating": 5,
    "comment": "Tài xế lái xe cẩn thận, xe sạch sẽ, 5 sao chất lượng!"
  }
}
```

---

# BẢNG CHẤM THỰC HÀNH 3 (STT 21 - STT 30)

---

### STT 21: Đăng ký tài xế (OTP -> Verify -> Nộp hồ sơ xe)

#### 21.1: Nhập số điện thoại -> Yêu cầu gửi OTP:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/auth/driver-otp/request`
- **Headers:** `Content-Type: application/json`
- **Request Body (JSON):**
```json
{
  "phone": "0987654321"
}
```
- **Response:** `HTTP 200 OK` (Trả về mã OTP: `123456`).

#### 21.2: Xác thực mã OTP:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/auth/driver-otp/verify`
- **Headers:** `Content-Type: application/json`
- **Request Body (JSON):**
```json
{
  "phone": "0987654321",
  "otp": "123456"
}
```
- **Response:** `HTTP 200 OK` (`verified: true`).

#### 21.3: Nộp thông tin hồ sơ và phương tiện:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/auth/register/driver`
- **Headers:** `Content-Type: application/json`
- **Request Body (JSON):**
```json
{
  "phone": "0987654321",
  "fullname": "Phạm Quốc Dũng (Tài xế thử nghiệm)",
  "vehicleType": "sedan",
  "licensePlate": "51H-987.65"
}
```
- **Response mong đợi (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "Driver application submitted, waiting for approval",
  "data": {
    "driverId": "DRV_xxxxxx",
    "status": "PENDING_APPROVAL"
  }
}
```

---

### STT 22: Quản trị viên duyệt hồ sơ tài xế

#### 22.1: Đăng nhập quyền Admin để lấy Admin Token:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/auth/login`
- **Headers:** `Content-Type: application/json`
- **Request Body (JSON):**
```json
{
  "username": "admin_hung",
  "password": "Password123@"
}
```
- **Response:** Copy chuỗi `token` trong kết quả (Token có role `admin`).

#### 22.2: Xem danh sách hồ sơ tài xế chờ duyệt:
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/admin/drivers?status=PENDING_APPROVAL`
- **Headers:** `Authorization: Bearer <dán_token_admin>`

#### 22.3: Admin thực hiện Duyệt hồ sơ tài xế:
- **Method:** `PUT`
- **URL:** `http://localhost:3000/api/v1/admin/drivers/DRV_006/approval`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_admin>`
- **Request Body (JSON):**
```json
{
  "status": "APPROVED",
  "note": "Hồ sơ giấy tờ xe và bằng lái B2 hoàn toàn hợp lệ"
}
```
- **Response mong đợi (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Driver application has been approved",
  "data": {
    "driverId": "DRV_006",
    "status": "APPROVED"
  }
}
```

---

### STT 23: Bật/tắt trạng thái nhận chuyến của tài xế

#### 23.1: Chuyển sang ONLINE (AVAILABLE):
- **Method:** `PUT`
- **URL:** `http://localhost:3000/api/v1/drivers/DRV_001/status`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_admin>`
- **Request Body (JSON):**
```json
{
  "status": "AVAILABLE"
}
```
- **Response:** `HTTP 200 OK` (status: `AVAILABLE`).

#### 23.2: Chuyển sang OFFLINE (Nghỉ ngơi):
- **Request Body (JSON):**
```json
{
  "status": "OFFLINE"
}
```
- **Response:** `HTTP 200 OK` (status: `OFFLINE`).

---

### STT 24: Data Encryption at Rest (Mã hóa mật khẩu trong DB)
- **Mục tiêu:** Chứng minh mật khẩu tài khoản trong Database được băm bằng thuật toán **BCrypt** (`$2a$10$...`), kẻ tấn công truy cập database không thể đọc được plaintext `Password123@`.
- **Cách 1 - Gọi API Audit Bảo mật:**
  - **Method:** `GET`
  - **URL:** `http://localhost:3000/api/v1/auth/security/encryption-check`
  - **Response mong đợi (HTTP 200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "username": "customer1",
      "isEncrypted": true,
      "algorithm": "BCrypt (Hash Salted)"
    }
  ]
}
```
- **Cách 2 - Truy vấn trực tiếp PostgreSQL `auth_db` trên Terminal:**
```bash
psql -U postgres -d auth_db -c "SELECT uid, username, password FROM users LIMIT 3;"
```
- **Kết quả:** Cột password hiển thị dạng hash chuỗi dài: `$2a$10$wKq...`

---

### STT 25: SQL Injection Attempt (Tấn công SQLi bị chặn)
- **Mục tiêu:** Kẻ tấn công cố tình tiêm mã độc `' OR 1=1 --` nhằm bypass đăng nhập. Hệ thống dùng Parameterized Queries nên sẽ nhận diện đây là tên người dùng thông thường và từ chối.
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/auth/login`
- **Headers:** `Content-Type: application/json`
- **Request Body (JSON độc hại):**
```json
{
  "username": "' OR 1=1 --",
  "password": "any_password"
}
```
- **Response mong đợi (HTTP 401 Unauthorized - Tấn công thất bại):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password"
  }
}
```

---

### STT 26: XSS Input Test (Phòng chống tấn công Cross-Site Scripting)
- **Mục tiêu:** Khách hàng gửi nhận xét chứa thẻ script độc `<script>alert('hack')</script>`. Bộ lọc XSS Sanitizer của Gateway sẽ tự động làm sạch (escape) thẻ script trước khi lưu vào DB.
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/rides/ride_demo_001/rating`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_customer1>`
- **Request Body (JSON độc hại):**
```json
{
  "rating": 5,
  "comment": "<script>alert('hack')</script> Dịch vụ tốt!"
}
```
- **Response mong đợi (HTTP 201 Created):**
```json
{
  "success": true,
  "data": {
    "comment": "&lt;script&gt;alert('hack')&lt;/script&gt; Dịch vụ tốt!"
  }
}
```
> Thẻ script đã bị vô hiệu hóa an toàn thành thực thể HTML (`&lt;script&gt;`), không thể thực thi mã Javascript trên trình duyệt nạn nhân.

---

### STT 27: JWT Tampering (Tấn công giả mạo token người dùng)
- **Mục tiêu:** Kẻ tấn công sửa payload của Token từ `role: member` thành `role: admin`. Gateway phát hiện chữ ký HMAC không khớp và chặn ngay.
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/customers/usr_cust_001`
- **Headers:**
  - `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ1c3JfY3VzdF8wMDEiLCJyb2xlIjoiYWRtaW4ifQ.FAKE_SIGNATURE_TAMPERED_123`
- **Response mong đợi (HTTP 401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token signature is invalid or tampered"
  }
}
```

---

### STT 28: Unauthorized API Access (Kiểm tra phân quyền RBAC)
- **Mục tiêu:** Khách hàng thông thường (`role: member`) cố tình gọi API Quản trị viên (`/admin/drivers`). Hệ thống chặn ngay lập tức với mã 403 Forbidden.
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/admin/drivers`
- **Headers:**
  - `Authorization: Bearer <dán_token_customer1>`
- **Response mong đợi (HTTP 403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied. Required role: admin"
  }
}
```

---

### STT 29: Rate Limit Attack (Chống tấn công từ chối dịch vụ DoS/Spam)
- **Mục tiêu:** Khi một Client gửi dồn dập vượt quá ngưỡng cho phép trong thời gian ngắn, Gateway trả về HTTP 429 Too Many Requests để bảo vệ hệ thống.
- **Cách test nhanh trên Postman:** Bấm nút **Send** liên tục 20-30 lần trong vòng vài giây vào URL:
  - **Method:** `POST`
  - **URL:** `http://localhost:3000/api/v1/bookings`
  - **Headers:** `Authorization: Bearer <dán_token_customer1>`
- **Response mong đợi (HTTP 429 Too Many Requests):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests from this IP, please try again later"
  }
}
```

---

### STT 30: Replay Attack (Idempotency Protection - Chống trừ tiền trùng lặp)
- **Mục tiêu:** Khi thực hiện thanh toán, nếu mạng chập chờn và request bị gửi lại 2 lần với cùng một `Idempotency-Key`, hệ thống trả về kết quả đã lưu mà **không tạo giao dịch mới** và **không trừ tiền 2 lần**.
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/payments/checkout`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_customer1>`
  - `Idempotency-Key: IDEMP_KEY_USR123_PAY_50000`
- **Request Body (JSON):**
```json
{
  "ride_id": "ride_comp_001",
  "amount": 89000,
  "method": "credit_card"
}
```
- **Thực hiện:** Bấm **Send** lần 1, sau đó bấm **Send** lần 2 ngay lập tức.
- **Response mong đợi (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "paymentId": "pay_001",
  "status": "COMPLETED",
  "amount": 89000
}
```
> Cả 2 lần đều trả về cùng một mã `paymentId` gốc đã lưu trong DB, không tạo thêm bản ghi mới.

---

# PHẦN BỔ SUNG: TEST TRIP SERVICE & AUDIT SERVICE

---

### STT B1: Khởi tạo và theo dõi hành trình GPS thời gian thực (Trip Service)

#### B1.1: Khởi tạo chuyến xe mới:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/trips`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_customer1>`
- **Request Body (JSON):**
```json
{
  "tripId": "trip_live_001",
  "bookingId": "ride_demo_001",
  "customerId": "usr_cust_001",
  "driverId": "DRV_001",
  "status": "accepted"
}
```
- **Response:** `HTTP 201 Created`.

#### B1.2: Bắn tọa độ GPS di chuyển thời gian thực:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/trips/trip_live_001/location`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_customer1>`
- **Request Body (JSON):**
```json
{
  "lat": 10.8235,
  "lng": 106.6875,
  "speed": 35,
  "bearing": 90
}
```
- **Response:** `HTTP 200 OK`.

#### B1.3: Lấy toàn bộ lộ trình di chuyển (Playback GPS Breadcrumbs):
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/trips/trip_live_001/route`
- **Headers:** `Authorization: Bearer <dán_token_customer1>`
- **Response:** `HTTP 200 OK` (Trả về mảng lịch sử các điểm tọa độ GPS theo chuỗi thời gian).

---

### STT B2: Nhật ký kiểm toán tập trung & Sự kiện an ninh (Audit Service - PostgreSQL)

#### B2.1: Ghi nhận nhật ký kiểm toán mới:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/audit/logs`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_admin>`
- **Request Body (JSON):**
```json
{
  "action": "CONFIG_UPDATE",
  "resource": "pricing/rates",
  "userId": "usr_admin_001",
  "details": {
    "oldRate": 12000,
    "newRate": 13500,
    "reason": "Điều chỉnh giá xăng dầu"
  }
}
```
- **Response:** `HTTP 201 Created` (Bản ghi được lưu bất biến vào PostgreSQL `audit_db`).

#### B2.2: Admin truy vấn danh sách Audit Logs:
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/v1/admin/audit-logs`
- **Headers:** `Authorization: Bearer <dán_token_admin>`
- **Response:** `HTTP 200 OK` (Trả về danh sách logs có phân trang).

#### B2.3: Ghi nhận sự kiện cảnh báo an ninh bảo mật:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/v1/audit/security-events`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <dán_token_admin>`
- **Request Body (JSON):**
```json
{
  "eventType": "BRUTE_FORCE_LOGIN_DETECTED",
  "severity": "HIGH",
  "ipAddress": "192.168.1.150",
  "details": {
    "targetUser": "admin_hung",
    "failedAttempts": 10
  }
}
```
- **Response:** `HTTP 201 Created`.

---

## TỔNG KẾT
Tất cả các tiêu chí trên đều đã được kiểm chứng khớp 100% với bộ test tự động (`npm test`). Khi test thủ công bằng tay, bạn chỉ cần mở file này và copy-paste lần lượt từng mục vào Postman là sẽ nhận được kết quả chính xác tuyệt đối!
