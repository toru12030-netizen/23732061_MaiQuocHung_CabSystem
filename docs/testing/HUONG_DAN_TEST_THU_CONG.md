# HƯỚNG DẪN TEST THỦ CÔNG DỰ ÁN CAB SYSTEM (IUH MSA)
**Sinh viên:** Mai Quốc Hưng - **MSSV:** 23732061  
**File Postman:** `CAB_System_IUH.postman_collection.json`  
**File Môi trường:** `CAB_System_IUH.postman_environment.json`

---

## I. CÁCH IMPORT VÀO POSTMAN

1. Mở ứng dụng **Postman**.
2. Nhấn nút **Import** (góc trên bên trái).
3. Kéo thả 2 file sau vào:
   - `CAB_System_IUH.postman_collection.json`
   - `CAB_System_IUH.postman_environment.json`
4. Ở góc trên bên phải Postman, chọn môi trường: **CAB System - Local Environment**.

---

## II. HƯỚNG DẪN TEST THỦ CÔNG CHI TIẾT THEO PHIẾU CHẤM

### THỰC HÀNH 1: KHỞI TẠO & ĐỊNH DANH (STT 1 - 10)

| STT | Tên Request trong Postman | Thao tác thực hiện | Kết quả hiển thị cho Giảng viên xem |
|:---:|---|---|---|
| **01** | `STT 01 - Mô tả kiến trúc` | Bấm xem Description của request | Giải thích mô hình Monorepo: `apps/`, `packages/shared-config`, `infra/`. Mỗi service tuân thủ Clean Architecture. |
| **02** | `STT 02 - Kiểm tra .gitignore & .env` | Mở xem file `.gitignore` và `.env.example` trên VS Code | File `.gitignore` đã loại trừ `.env`, `node_modules`, `dist/`. File `.env.example` đầy đủ cấu hình mẫu. |
| **03** | `STT 03 - Mô tả nhiệm vụ Gateway` | Bấm xem Description | Gateway là cổng vào duy nhất (port 3000): Routing, JWT Auth, RBAC, Rate Limiting, XSS Sanitization, Correlation ID. |
| **04** | `STT 04 - Mô tả IPC` | Bấm Send `GET /health/services` | Đồng bộ qua gRPC (Auth port 50051, Customer port 50052); Bất đồng bộ qua Apache Kafka (`cab-kafka:9092`). |
| **05** | `STT 05 - Liệt kê container` | Mở Terminal gõ `docker ps` | Hiển thị 11 containers đang chạy: Gateway, 7 Microservices, Kafka, Zookeeper, Secure DB. |
| **06** | `STT 06.1 - Health Check` <br> `STT 06.2 - Ready Check` <br> `STT 06.3 - Services Health` | Bấm **Send** lần lượt 3 request | - `/health`: `HTTP 200, status: healthy`<br>- `/ready`: `HTTP 200, status: ready`<br>- `/health/services`: Danh sách 7 service đều `UP` |
| **07** | `STT 07 - Kiểm tra Kafka` | Bấm **Send** | Trả về `HTTP 200`, hệ thống Kafka event stream hoạt động bình thường. |
| **08** | `STT 08 - Kiểm tra qua Gateway` | Bấm **Send**, xem tab **Headers** ở kết quả | Xuất hiện 2 header do Gateway sinh ra: `X-Correlation-Id` và `RateLimit-Limit: 1000`. |
| **09** | `STT 09 - Đăng ký khách hàng` | Bấm **Send** | `HTTP 201 Created`. Tạo tài khoản thành công. |
| **10** | `STT 10 - Đăng nhập khách hàng` | Bấm **Send** | `HTTP 200 OK`. Hệ thống cấp JWT token. **(Copy chuỗi `data.token` dán vào biến `jwt_customer` để dùng tiếp)**. |

---

### THỰC HÀNH 2: VẬN HÀNH CHUYẾN ĐI & NGHIỆP VỤ (STT 11 - 20)

| STT | Tên Request trong Postman | Thao tác thực hiện | Kết quả hiển thị cho Giảng viên xem |
|:---:|---|---|---|
| **11** | `STT 11 - Lấy thông tin khách hàng` | Bấm **Send** | Trả về thông tin khách hàng `usr_cust_001` (CustomerService via gRPC). |
| **12** | `STT 12 - Lấy thông tin tài xế` | Bấm **Send** | Trả về thông tin tài xế `DRV_001` từ MongoDB `driver_db`. |
| **13** | `STT 13 - Liệt kê tài xế 1km` | Bấm **Send** | Danh sách các tài xế xung quanh ĐH IUH (bán kính 1000m, phân trang `limit=5`). |
| **14** | `STT 14 - Lịch sử booking của khách` | Bấm **Send** | Danh sách các chuyến đi của khách hàng `usr_cust_001`. |
| **15** | `STT 15 - Đặt xe` | Bấm **Send** | `HTTP 201 Created`. Booking được tạo ở trạng thái `requested`, tìm được tài xế xung quanh. |
| **16** | `STT 16 - Tài xế nhận chuyến` | Bấm **Send** | Chuyến đi `ride_demo_001` được gán cho tài xế `DRV_001`, trạng thái chuyển thành `assigned`. |
| **17** | `STT 17.1 -> 17.3 - Cập nhật trạng thái` | Bấm **Send** tuần tự: <br>1. ARRIVED <br>2. IN_PROGRESS <br>3. COMPLETED | Trạng thái chuyến đi chuyển đổi đúng trình tự nghiệp vụ thực tế. |
| **18** | `STT 18 - Hủy chuyến` | Bấm **Send** | Chuyến `ride_demo_002` chuyển sang `cancelled`, lưu lý do hủy. |
| **19** | `STT 19.1 - Checkout thanh toán` <br>`STT 19.2 - Webhook callback` | Bấm **Send** lần lượt | - 19.1: Sinh URL cổng thanh toán và `transaction_id`<br>- 19.2: Webhook cập nhật payment thành `COMPLETED` |
| **20** | `STT 20 - Đánh giá chuyến đi` | Bấm **Send** | Đánh giá 5 sao và nhận xét được lưu thành công vào MongoDB `ratings`. |

---

### THỰC HÀNH 3: TÀI XẾ & AN TOÀN THÔNG TIN (STT 21 - 30)

| STT | Tên Request trong Postman | Thao tác thực hiện | Kết quả hiển thị cho Giảng viên xem |
|:---:|---|---|---|
| **21** | `STT 21.1 -> 21.3 - Đăng ký tài xế` | Bấm **Send** lần lượt:<br>1. Gửi OTP<br>2. Xác thực OTP<br>3. Nộp hồ sơ xe | Hồ sơ tài xế được tạo ở trạng thái `PENDING_APPROVAL` (chờ Admin duyệt). |
| **22** | `STT 22.1 -> 22.3 - Duyệt hồ sơ tài xế` | Bấm **Send**:<br>1. Login Admin (Lưu token vào `jwt_admin`)<br>2. Xem danh sách hồ sơ<br>3. Duyệt hồ sơ | Hồ sơ tài xế chuyển thành `APPROVED` (Trạng thái hoạt động `AVAILABLE`). |
| **23** | `STT 23.1 -> 23.2 - Bật/tắt nhận chuyến` | Bấm **Send** chuyển Online (`AVAILABLE`) hoặc Offline (`OFFLINE`) | Trạng thái tài xế được cập nhật trực tiếp vào MongoDB `drivers`. |
| **24** | `STT 24 - Data encryption at rest` | Bấm **Send** | Mật khẩu lưu trong Postgres được mã hóa bằng **Bcrypt ($2a$10$...)**, hoàn toàn không lộ plaintext. |
| **25** | `STT 25 - SQL injection attempt` | Bấm **Send** | Username `' OR 1=1 --` bị Parameterized Query chặn đứng, trả về `HTTP 401 Unauthorized`. |
| **26** | `STT 26 - XSS input test` | Bấm **Send** | Mã độc `<script>alert('hack')</script>` bị Middleware khử sạch, comment lưu trữ an toàn. |
| **27** | `STT 27 - JWT tampering` | Bấm **Send** | Token bị sửa chữ ký (tampered) bị Gateway từ chối ngay lập tức: `HTTP 401 Unauthorized`. |
| **28** | `STT 28 - Unauthorized API access` | Bấm **Send** | Khách hàng (role: member) gọi API Admin bị từ chối với `HTTP 403 Forbidden`. |
| **29** | `STT 29 - Rate limit attack` | Bấm **Send liên tục 11-12 lần thật nhanh** | Nhận ngay `HTTP 429 Too Many Requests`, hệ thống bảo vệ không bị sập. |
| **30** | `STT 30.1 -> 30.2 - Replay attack` | Bấm **Send** request 1, sau đó bấm tiếp request 2 | Cùng gửi 1 request `50,000đ` nhưng hệ thống trả lại giao dịch cũ, **không bị trừ tiền 2 lần (No double charge)**. |

---

## III. DỮ LIỆU ĐĂNG NHẬP MẶC ĐỊNH SẴN CÓ TRONG DATABASE

- **Khách hàng (Customer):**
  - Username: `customer1`
  - Password: `Password123@`
- **Quản trị viên (Admin):**
  - Username: `admin_hung`
  - Password: `Password123@`
- **Mã OTP mặc định cho tài xế:** `123456`
