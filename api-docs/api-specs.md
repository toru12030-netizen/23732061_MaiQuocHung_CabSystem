# 📑 TÀI LIỆU ĐẶC TẢ API (API SPECIFICATION)
## CAB System – Nền tảng đặt xe trực tuyến

- **Phiên bản:** 1.0.0
- **Tác giả:** Mai Quốc Hưng
- **Base URL:** `http://localhost:3000/api/v1`
- **Interactive Swagger UI:** `http://localhost:3000/api-docs`
- **Tiêu chuẩn:** RESTful API, JSON Payload, JWT Bearer Authentication

---

## I. QUY CHUẨN CHUNG (GENERAL CONVENTIONS)

### 1. Chuẩn hóa Định dạng Dữ liệu phản hồi (Response Format)
Mọi API trong hệ thống đều trả về cấu trúc JSON đồng nhất:

#### Phản hồi thành công (Success Response):
```json
{
  "success": true,
  "data": { ... },
  "message": "Thông điệp mô tả kết quả xử lý"
}
```
#### Phản hồi thành công (Success Response):
```json
{
  "success": false,
  "message": "Mô tả nguyên nhân lỗi",
  "errors": [ ... ]
}
```
### 2. Các mã trạng thái HTTP (HTTP Status Codes)
- 200 OK: Xử lý thành công yêu cầu GET, PUT, PATCH.

- 201 Created: Tạo mới tài nguyên thành công (POST).

- 204 No Content: Xử lý thành công nhưng không trả về dữ liệu nội dung body.

- 400 Bad Request: Dữ liệu gửi lên không hợp lệ hoặc thiếu trường bắt buộc.

- 401 Unauthorized: Chưa đăng nhập hoặc Token JWT không hợp lệ / hết hạn.

- 403 Forbidden: Không có quyền truy cập vào tài nguyên.

- 404 Not Found: Không tìm thấy tài nguyên theo ID hoặc đường dẫn.

- 409 Conflict: Xung đột dữ liệu.

- 422 Unprocessable Entity: Dữ liệu định dạng đúng nhưng không thể xử lý.

- 500 Internal Server Error: Lỗi máy chủ không mong muốn.

### 3. Cơ chế Xác thực (Authentication)
Các API yêu cầu đăng nhập cần truyền header:
Authorization: Bearer <access_token>

## II. DANH MỤC CÁC ENDPOINTS CHI TIẾT
### 1. Phân hệ Xác thực & Quản lý tài khoản (Auth Module - 01-auth.yaml)
#### 1.1 Đăng ký tài khoản Khách hàngMethod: 
- POSTEndpoint: /auth/register/customer
- Truy xuất: FR-AUTH-01  
- Request Body:
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "customer@example.com",
  "phone": "0912345678",
  "password": "Password123"
}
```
- Response (201 Created): { "description": "Customer account created" }
#### 1.2 Đăng ký tài khoản Đối tác Tài xế
- Method: POSTEndpoint: /auth/register/driver
- Truy xuất: FR-AUTH-02   
Request Body:
```json
{
  "fullName": "Trần Văn Tài",
  "email": "driver@example.com",
  "phone": "0987654321",
  "password": "Driver123",
  "licenseNumber": "123456789012",
  "licenseClass": "B2",
  "licenseImageUrl": "[https://example.com/images/license.jpg](https://example.com/images/license.jpg)"
}
``` 
- Response (201 Created): 
{ "description": "Driver application submitted for approval" }   

#### 1.3 Đăng nhập hệ thống
- Method: POSTEndpoint: /auth/login
- Truy xuất: FR-AUTH-03  
-  Request Body:
```json
{
  "identifier": "customer@example.com",
  "password": "Password123"
}
```
- Response (200 OK): 
Trả về đối tượng AuthSession gồm accessToken, refreshToken, expiresIn và thông tin user.   

#### 1.4 Cập nhật hồ sơ cá nhân
- Method: PATCHEndpoint: /auth/profile
- Truy xuất: FR-AUTH-04   
- Headers: Authorization: Bearer <token>   
- Request Body:
```json
{
  "fullName": "Nguyễn Văn A (Cập nhật)",
  "phone": "0912345679",
  "avatarUrl": "[https://example.com/avatar.jpg](https://example.com/avatar.jpg)"
}
```

#### 1.5 Đổi mật khẩu
- Method: PUTEndpoint: /auth/password
- Truy xuất: FR-AUTH-05   
- Request Body:
```json
{
  "currentPassword": "Password123",
  "newPassword": "NewPassword456"
}
```
- Response (204 No Content): 
{ "description": "Password changed and existing sessions revoked" }   
#### 1.6 Đăng xuất (Thu hồi phiên)
- Method: POSTEndpoint: /auth/logout
- Truy xuất: FR-AUTH-06   
- Response (204 No Content): { "description": "Session revoked" }   
-----
### 2. Phân hệ Tài xế & Phương tiện (Driver & Vehicle Module - 02-driver-vehicle.yaml)
#### 2.1 Xem danh sách phương tiện và Đăng ký xe mới
- Method: GET / POSTEndpoint: /drivers/me/vehicles
- Truy xuất: FR-DRV-01   
- Request Body (POST):
```json
{
  "plateNumber": "51H-123.45",
  "brand": "Honda",
  "model": "CR-V",
  "color": "Đen",
  "vehicleType": "suv",
  "seats": 7,
  "registrationImageUrl": "[https://example.com/reg.jpg](https://example.com/reg.jpg)"
}
```

#### 2.2 Cập nhật trạng thái hoạt động
- Method: PUTEndpoint: /drivers/me/status
- Truy xuất: FR-DRV-02, FR-DRV-03   
- Request Body:
```json
{
  "status": "available"
}
```

#### 2.3 Xem hiệu suất và thu nhập tài xế
- Method: GET
- Endpoint: /drivers/me/performance
- Truy xuất: FR-DRV-05   
### 2.4 Phê duyệt hoặc từ chối hồ sơ tài xế (Admin/Operator)
- Method: PUTEndpoint: /admin/drivers/{driverId}/approval
- Truy xuất: FR-DRV-04   
- Request Body:
```json
{
  "decision": "approved",
  "reason": "Hồ sơ hợp lệ"
}
```

#### 2.5 Khóa hoặc kích hoạt lại tài khoản tài xế
- Method: PUTEndpoint: /admin/drivers/{driverId}/suspension
- Truy xuất: FR-DRV-06   
- Request Body:
```json
{
  "active": false,
  "reason": "Vi phạm quy chế ứng dụng"
}
```

### 3. Phân hệ Đặt xe & Chuyến đi (Ride Booking Module - 03-ride-booking.yaml)
#### 3.1 Ước tính khoảng cách, thời gian và cước phí
- Method: POSTEndpoint: /rides/estimate
- Truy xuất: FR-RIDE-01, FR-RIDE-02   
- Request Body:
```json
{
  "pickup": {
    "address": "12 Nguyễn Văn Bảo, Gò Vấp",
    "location": { "latitude": 10.8222, "longitude": 106.6881 }
  },
  "dropoff": {
    "address": "Chợ Bến Thành, Quận 1",
    "location": { "latitude": 10.7769, "longitude": 106.7009 }
  }
}
```
#### 3.2 Tạo yêu cầu đặt xe
- Method: POSTEndpoint: /rides
- Truy xuất: FR-RIDE-03   
- Request Body:
```json
{
  "pickup": {
    "address": "12 Nguyễn Văn Bảo, Gò Vấp",
    "location": { "latitude": 10.8222, "longitude": 106.6881 }
  },
  "dropoff": {
    "address": "Chợ Bến Thành, Quận 1",
    "location": { "latitude": 10.7769, "longitude": 106.7009 }
  },
  "vehicleType": "sedan",
  "paymentMethod": "EWALLET"
}
```

#### 3.3 Lấy lịch sử và chi tiết chuyến đi
- Method: GET
- Endpoint: /rides hoặc /rides/{rideId}
- Truy xuất: FR-RIDE-09   
#### 3.4 Hủy chuyến đi và Cập nhật vòng đời chuyến đi
- Method: POST / PUT
- Endpoint: /rides/{rideId}/cancel hoặc /rides/{rideId}/status
- Truy xuất: FR-RIDE-04 đến FR-RIDE-08  
### 4. Phân hệ Tìm kiếm & Phân công Tài xế (Matching Module - 04-matching.yaml)
- GET /rides/{rideId}/offers: Lấy đề xuất cuốc xe cho tài xế.   
- POST /rides/{rideId}/offers/accept: Chấp nhận đề xuất chuyến xe.   
- POST /rides/{rideId}/offers/decline: Từ chối đề xuất chuyến xe.   
- GET /rides/{rideId}/matching: Kiểm tra trạng thái tìm tài xế của chuyến đi.   

### 5. Phân hệ Tính cước & Thanh toán (Payment Module - 05-payment.yaml)
- GET / PUT /admin/pricing: Quản lý cấu hình giá vé.   
- GET /rides/{rideId}/payment: Xem bảng kê cước phí và trạng thái thanh toán.   
- POST /rides/{rideId}/payment/checkout: Thực hiện thanh toán điện tử.   
- POST /rides/{rideId}/payment/cash-confirmation: Xác nhận thu tiền mặt.   

### 6. Phân hệ Định vị & Giám sát (Tracking Module - 06-tracking.yaml)
- PUT /drivers/me/location: Gửi tọa độ GPS hiện tại của tài xế.   
- GET /rides/{rideId}/location: Lấy vị trí tài xế và ETA cho chuyến đi.   
- GET /admin/driver-locations: Lấy danh sách vị trí tài xế hoạt động cho bản đồ tổng quan.   

### 7. Phân hệ Thông báo (Notification Module - 07-notification.yaml)
- GET /notifications: Lấy danh sách thông báo cá nhân.   
- POST /notifications/read-all: Đánh dấu tất cả thông báo đã đọc.  
- PUT /notifications/{notificationId}/read: Đánh dấu một thông báo cụ thể là đã đọc.   
### 8. Phân hệ Đánh giá (Rating Module - 08-rating.yaml)
- POST /rides/{rideId}/rating: Gửi đánh giá cho chuyến đi đã hoàn thành.   
- GET /drivers/{driverId}/ratings: Xem danh sách đánh giá của tài xế.   
### 9. Phân hệ Quản trị & Báo cáo (Admin Module - 09-admin.yaml)
- GET /admin/dashboard: Lấy chỉ số tổng quan trên Dashboard.   
- GET /admin/customers: Tìm kiếm và quản lý khách hàng.   
- GET /admin/drivers: Tìm kiếm và quản lý tài xế / phương tiện.  
- GET /admin/rides / POST /admin/rides: Giám sát và can thiệp chuyến đi.  
- GET /admin/payments: Tra cứu giao dịch thanh toán.   
- GET /admin/reports/revenue: Báo cáo doanh thu tài chính.   
- GET /admin/reports/rides: Báo cáo hoàn thành và hủy chuyến.   
- GET /admin/reports/drivers: Báo cáo hiệu suất tài xế.   

### 10. Phân hệ Bảo mật & Kiểm toán (Security & Audit Module - 10-security-audit.yaml)
- GET /admin/audit-logs: Tra cứu nhật ký kiểm toán (Audit Logs).   
- GET /health: Kiểm tra trạng thái hoạt động API (Health Check).   
- GET /health/db: Kiểm tra kết nối cơ sở dữ liệu.   