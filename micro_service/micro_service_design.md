# CAB System – Thiết kế Microservices và DDD

**Phiên bản:** 2.0
**Phạm vi:** MVP theo SRS CAB System v3.0 và OpenAPI trong `api-docs/`
**Nguyên tắc:** tài liệu này mô tả kiến trúc đích cho bài thực hành; tên endpoint public phải khớp `api-docs/openapi.yaml`.

## 1. Quyết định kiến trúc

CAB dùng microservice theo bounded context, triển khai bằng Docker Compose cho môi trường local. Client chỉ truy cập qua API Gateway. Mỗi service sở hữu collection/database của mình, không truy vấn trực tiếp MongoDB của service khác. Dữ liệu thường và dữ liệu nhạy cảm được đặt trên hai máy chủ MongoDB riêng biệt; chỉ service owner được cấp kết nối tới máy chủ dữ liệu nhạy cảm. Giao tiếp nội bộ đồng bộ dùng HTTP khi cần phản hồi ngay; workflow bất đồng bộ dùng RabbitMQ.

| Thành phần | Trách nhiệm chính | Data ownership |
|---|---|---|
| `api-gateway` | Entry point HTTP; route, JWT validation, RBAC coarse-grained, rate limit, correlation ID và chuẩn hóa lỗi | Không sở hữu domain data |
| `auth-service` | Customer/Driver account, đăng ký, OTP, đăng nhập, token/session, hồ sơ người dùng cơ bản | `cab-secure-db.auth_secure_db`: account, refresh token, OTP/verification; dữ liệu hiển thị tối thiểu ở App DB |
| `driver-service` | Hồ sơ tài xế, xét duyệt, phương tiện, trạng thái online/busy và vị trí hiện tại | `cab-secure-db.driver_secure_db`: PII/giấy tờ; trạng thái, metadata xe và vị trí hiện tại ở App DB |
| `booking-service` | Ride/booking, dispatch, offer, matching retry và lifecycle chuyến | `rides`, `ride_offers`, trạng thái chuyến |
| `payment-service` | Pricing config, fare, payment, provider callback và idempotency | `pricing_configs`, `payments`, idempotency records |
| `review-service` | Đánh giá, rating trung bình và lịch sử chuyến đọc từ event projection | `rating_reviews`, `trip_history` projection |
| `notification-service` | Hộp thư thông báo, email và Socket.IO delivery | `notifications`, delivery state |
| `admin-service` | Dashboard/report queries, operator intervention workflow và audit log query/append | `audit_logs`, admin read projections; domain state vẫn thuộc service gốc |
| `cab-app-db` (MongoDB server) | Dữ liệu nghiệp vụ vận hành | Database/collection tách theo service ownership; không chứa credential hoặc bản gốc giấy tờ định danh |
| `cab-secure-db` (MongoDB server riêng) | Dữ liệu xác thực và PII/giấy tờ nhạy cảm | Chỉ `auth-service` và `driver-service` được truy cập; credentials riêng và quyền tối thiểu |
| RabbitMQ | Integration event transport | Durable queues, retry và dead-letter queue |

`admin-service` là phần bổ sung để có nơi triển khai các API quản trị/audit đang có trong `api-docs/09-admin.yaml` và `10-security-audit.yaml`. Nó không được sửa trực tiếp dữ liệu của service nghiệp vụ; mọi thay đổi được gửi bằng API command tới owner service.

### 1.1 Cấu trúc source code đề xuất

```text
cab-system/
  apps/
    customer-web/
    driver-web/
    admin-web/
  services/
    api-gateway/
    auth-service/
    driver-service/
    booking-service/
    payment-service/
    review-service/
    notification-service/
    admin-service/
  packages/
    api-contracts/
    event-contracts/
    shared-config/
  infra/
    docker-compose.yml
    gateway/
    rabbitmq/
  api-docs/
  postman/
  .env.example
```

Mỗi backend service giữ cấu trúc nhất quán `src/routes`, `src/controllers`, `src/services`, `src/models`, `src/middlewares`, `src/config`, `src/events`. Chỉ chia sẻ DTO/event schema và tiện ích thuần; không chia sẻ domain model hoặc model database giữa service.

## 2. Bounded Context và quy trình nghiệp vụ

### 2.1 Phân rã domain và ánh xạ service

Bounded Context xác định ranh giới mô hình nghiệp vụ; trong MVP, một service có thể triển khai nhiều context có vòng đời gắn chặt để giảm chi phí vận hành. Do đó, Booking, Matching/Dispatch và Trip Execution cùng chạy trong `booking-service`, nhưng được tổ chức thành module domain riêng. Chúng có thể tách thành service độc lập khi tải, ownership hoặc nhu cầu triển khai riêng biệt tăng lên.

| Bounded Context | Phân loại | Service MVP | Trách nhiệm và dữ liệu sở hữu |
|---|---|---|---|
| Identity & Access | Generic | `auth-service` | Tài khoản, thông tin xác thực, OTP, session/refresh token và RBAC. |
| Driver & Fleet | Supporting | `driver-service` | Hồ sơ tài xế, xét duyệt, phương tiện, trạng thái hoạt động và vị trí hiện tại. |
| Booking & Pricing | Core | `booking-service` | Ước tính, snapshot giá và yêu cầu đặt xe/ride. |
| Matching & Dispatch | Core | `booking-service` (module riêng) | Candidate, offer, timeout/retry, atomic accept và kết quả ghép tài xế. |
| Trip Execution | Core | `booking-service` (module riêng) | Vòng đời ride/trip, mốc thời gian, hủy và xử lý sự cố. |
| Tracking & Geolocation | Supporting | `driver-service` ở MVP | Thu GPS và vị trí mới nhất; phát vị trí chuyến qua Socket.IO. Tách riêng nếu cần scale/retention GPS độc lập. |
| Fare & Payment | Supporting | `payment-service` | Cấu hình giá, tính cước cuối, payment, callback và đối soát. |
| Rating & Feedback | Supporting | `review-service` | Đánh giá, rating trung bình và projection lịch sử. |
| Notification Hub | Generic | `notification-service` | Hộp thư, email và gửi thông báo realtime từ events. |
| Administration & Analytics | Generic | `admin-service` | API quản trị, audit log và read projections; không sở hữu trạng thái nghiệp vụ gốc. |

### 2.2 Ngôn ngữ nghiệp vụ (Ubiquitous Language)

| Thuật ngữ | Định nghĩa trong CAB | Context sở hữu |
|---|---|---|
| **Booking/Ride request** | Yêu cầu đặt xe của khách trước khi được gán tài xế; API MVP biểu diễn resource này là `ride`. | Booking & Pricing |
| **Dispatch offer** | Lời mời nhận một booking gửi cho một tài xế tại một thời điểm, có thời hạn phản hồi. | Matching & Dispatch |
| **Trip** | Chuyến vận chuyển sau khi tài xế nhận offer. Trong MVP, `Ride` aggregate quản lý xuyên suốt vòng đời này. | Trip Execution |
| **Driver availability** | Trạng thái `offline`, `available`, `busy` hoặc `suspended`; `driver-service` là nguồn dữ liệu authoritative. | Driver & Fleet |
| **Fare estimate** | Giá dự kiến trước khi khách xác nhận; được snapshot để thay đổi bảng giá không làm đổi estimate cũ. | Booking & Pricing |
| **Actual fare** | Giá cuối tính từ dữ liệu quãng đường/thời gian thực tế và bảng giá áp dụng. | Fare & Payment |
| **Integration event** | Thông điệp bất biến mô tả sự việc đã xảy ra; consumer tự xử lý, khác với command yêu cầu thực hiện hành động. | Producer context |

### 2.3 Context map

```mermaid
flowchart LR
    Client[Customer / Driver / Admin Web] --> Gateway[API Gateway]
    Gateway --> Auth[Auth Service]
    Gateway --> Driver[Driver Service]
    Gateway --> Booking[Booking Service]
    Gateway --> Payment[Payment Service]
    Gateway --> Review[Review Service]
    Gateway --> Admin[Admin Service]
    Gateway --> Notify[Notification Service]
    Auth --> MQ[(RabbitMQ)]
    Driver --> MQ
    Booking --> MQ
    Payment --> MQ
    Review --> MQ
    Admin --> MQ
    MQ --> Notify
    MQ --> Review
    MQ --> Admin
    Auth --> Mongo[(MongoDB - DB per service)]
    Driver --> Mongo
    Booking --> Mongo
    Payment --> Mongo
    Review --> Mongo
    Notify --> Mongo
    Admin --> Mongo
    Auth --> SecureAuth[(Secure MongoDB Server<br/>auth_secure_db)]
    Driver --> SecureDriver[(Secure MongoDB Server<br/>driver_secure_db)]
    Notify --> Socket[Socket.IO]
    Socket --> Client
    Payment --> PGW[Mock Payment Provider]
    Booking --> Map[Map Provider]
```

### 2.4 Luồng đặt xe đến đánh giá

1. Customer đăng ký/đăng nhập qua `auth-service`; driver gửi OTP, xác minh rồi nộp hồ sơ và phương tiện.
2. Operator/Admin duyệt hồ sơ qua `driver-service`; driver được duyệt mới chuyển sang `available`.
3. Customer xem ước tính và tạo ride qua `booking-service`. Ride chuyển sang `searching`.
4. Booking service yêu cầu driver-service tìm candidate phù hợp, ưu tiên khoảng cách; gửi offer theo thứ tự qua Socket.IO. Mỗi offer timeout mặc định 30 giây, tối đa 5 candidate.
5. Driver nhận offer. Accept phải atomic: một ride chỉ gán một driver. Ride chuyển sang `accepted`; driver chuyển `busy`.
6. Driver cập nhật tuần tự `driver_arrived` → `in_progress` → `completed`, đồng thời gửi GPS. Customer theo dõi qua API/Socket.IO.
7. Khi ride hoàn tất, booking service phát `RideCompleted`. Payment service lấy pricing hiện hành, tạo fare/payment. Thanh toán điện tử hoàn tất qua callback có chữ ký; tiền mặt do driver xác nhận.
8. Sau payment `COMPLETED`, customer gửi rating. Review service tạo một review cho mỗi ride và cập nhật rating/projection lịch sử.
9. Notification, admin/reporting projections và audit xử lý event độc lập. Lỗi gửi email không rollback ride hoặc payment.

### 2.5 Aggregate và invariant nghiệp vụ

| Context | Aggregate root | Invariant quan trọng |
|---|---|---|
| Identity & Account | `UserAccount` | Email/phone duy nhất; password luôn hash; tài khoản inactive không đăng nhập |
| Driver & Fleet | `DriverProfile`, `Vehicle` | Chỉ tài xế approved/active mới online; plate/license duy nhất; Busy không nhận offer mới |
| Booking, Dispatch & Trip | `Ride` | Chuyển trạng thái tuần tự; một tài xế được gán; mỗi thời điểm chỉ có một offer đang chờ; retry tối đa 5; kiểm tra customer/driver ownership; snapshot estimate. |
| Fare & Payment | `Payment`, `PricingConfig` | Payment gắn duy nhất một ride; amount không âm; fare giữ snapshot/version bảng giá; không lưu dữ liệu thẻ; callback/idempotency không xử lý giao dịch hai lần. |
| Review & History | `RatingReview`, history projection | Ride đã completed và payment completed; một review mỗi ride; history là projection |
| Notification | `Notification` | Người dùng chỉ đọc/cập nhật thông báo của mình; delivery retry không tạo bản ghi trùng |
| Administration & Audit | `AuditLog`, report projection | Audit append-only; intervention đi qua domain owner và ghi actor/reason |

`CustomerId`, `DriverId`, `RideId`, `PaymentId` là ID tham chiếu giữa context, không phải shared entity hay quan hệ database cross-service.

Invariant xuyên context không được thực thi bằng transaction MongoDB chung. Ví dụ, thao tác accept dùng conditional atomic update ở owner của ride; đổi trạng thái tài xế thực hiện qua API/command/event có kiểm soát. Nếu bước phụ lỗi, consumer retry hoặc quy trình bù xử lý trạng thái, không ghi trực tiếp vào database service khác.

## 3. Service contracts

Tất cả public API đi qua Gateway với base URL `http://localhost:3000/api/v1`. Các bảng liệt kê route public hiện có; không tạo endpoint public trùng tên nhưng khác nghĩa. Chi tiết request/response nằm trong `api-docs/`.

### 3.1 Auth service

| API | FR | Ghi chú |
|---|---|---|
| `POST /auth/register/customer` | FR-AUTH-01 | Tạo customer account |
| `POST /auth/driver-otp/request` | FR-AUTH-02 | Gửi OTP có rate limit; không trả OTP trong môi trường production |
| `POST /auth/driver-otp/verify` | FR-AUTH-02 | Trả verification token ngắn hạn |
| `POST /auth/register/driver` | FR-AUTH-02 | Yêu cầu verification token, hồ sơ và vehicle |
| `POST /auth/login`, `POST /auth/logout` | FR-AUTH-03, FR-AUTH-06 | JWT và thu hồi refresh session |
| `PATCH /auth/profile`, `PUT /auth/password` | FR-AUTH-04, FR-AUTH-05 | Profile/password của user hiện tại |
| `GET /customers/{customerId}` | FR-AUTH-04 | Owner hoặc role quản trị được phép xem |

### 3.2 Driver service

| API | FR | Ghi chú |
|---|---|---|
| `GET /drivers/{driverId}` | FR-DRV-05 | Trả thông tin hiển thị và xe, không trả giấy tờ riêng tư |
| `GET/POST /drivers/me/vehicles` | FR-DRV-01 | Danh sách/thêm xe của tài xế hiện tại |
| `PUT /drivers/me/status` | FR-DRV-02, FR-DRV-03 | Chỉ `offline`/`available` do driver yêu cầu; Busy do hệ thống quản lý |
| `PUT /drivers/me/location` | FR-TRACK-01 | Nhận GPS; tần suất mục tiêu 5–10 giây |
| `GET /drivers/nearby` | FR-MATCH-01 | Lat/lng, radiusKm, status, page, limit; yêu cầu đăng nhập và kiểm tra role |
| `PUT /admin/drivers/{driverId}/approval` | FR-DRV-04 | Operator/Admin duyệt/từ chối; ghi audit |
| `PUT /admin/drivers/{driverId}/suspension` | FR-DRV-06 | Admin khóa/mở tài xế |

### 3.3 Booking service (Booking + Matching + Trip lifecycle)

| API | FR | Ghi chú |
|---|---|---|
| `POST /rides/estimate` | FR-RIDE-01, FR-RIDE-02 | Route, duration và fare estimates |
| `POST /rides` | FR-RIDE-03 | Tạo ride và khởi động matching |
| `GET /rides`, `GET /rides/{rideId}` | FR-RIDE-09 | Lịch sử cá nhân và chi tiết có kiểm tra quyền |
| `GET /customers/me/bookings` | FR-RIDE-09 | Booking list có pagination |
| `GET /rides/{rideId}/offers` | FR-MATCH-03 | Driver xem offer đang chờ của mình |
| `POST /rides/{rideId}/offers/accept`, `/decline` | FR-MATCH-04, FR-MATCH-05 | Accept atomic; decline khởi chạy candidate kế tiếp |
| `GET /rides/{rideId}/matching` | FR-MATCH-06 | Trạng thái matching, retryCount, deadline |
| `PUT /rides/{rideId}/status` | FR-RIDE-04 → FR-RIDE-06 | Chỉ cho phép transition tuần tự |
| `POST /rides/{rideId}/cancel` | FR-RIDE-07, FR-RIDE-08 | Policy hủy, lưu actor/reason và thông báo |
| `GET /rides/{rideId}/location` | FR-TRACK-02, FR-TRACK-03 | Customer của ride xem vị trí/ETA |

### 3.4 Payment service

| API | FR | Ghi chú |
|---|---|---|
| `GET/PUT /admin/pricing` | FR-PAY-02 | Admin-only; ghi audit khi cập nhật |
| `GET /rides/{rideId}/payment` | FR-PAY-01, FR-PAY-07 | Breakdown và trạng thái |
| `POST /rides/{rideId}/payment/checkout` | FR-PAY-05, FR-PAY-06 | Bắt buộc `Idempotency-Key`; chỉ nhận opaque payment token |
| `POST /rides/{rideId}/payment/cash-confirmation` | FR-PAY-03, FR-PAY-04 | Chỉ driver được gán xác nhận tiền mặt |
| `POST /payments/{paymentId}/callback` | FR-PAY-05, FR-PAY-06 | Xác minh provider signature/timestamp và chống replay |

### 3.5 Review, Notification, Administration services

| Service | API chính | FR chính |
|---|---|---|
| `review-service` | `POST /rides/{rideId}/rating`, `GET /drivers/{driverId}/ratings` | FR-RATE-01 → FR-RATE-03 |
| `notification-service` | `GET /notifications`, `POST /notifications/read-all`, `PUT /notifications/{notificationId}/read`; Socket.IO delivery | FR-NOTIF-01 → FR-NOTIF-05 |
| `admin-service` | `/admin/dashboard`, `/admin/customers`, `/admin/drivers`, `/admin/rides`, `/admin/payments`, `/admin/reports/*`, `/admin/audit-logs`, `/health*` | FR-ADM-01 → FR-ADM-08, FR-SEC-03 → FR-SEC-05 |

`/health`, `/health/db`, `/ready`, `/health/services` được expose qua Gateway. Health endpoints không yêu cầu JWT ở local nhưng không trả secret, connection string hay stack trace.

## 4. Data ownership và persistence

MVP thống nhất MongoDB như SRS. Tách database hoặc ít nhất tách collection/user credentials theo service; không coi một MongoDB cluster là một database dùng chung. Một service không được gọi `db.collection` của service khác.

| Service | MongoDB data | Ghi chú |
|---|---|---|
| Auth | App DB: profile hiển thị tối thiểu. Secure DB: `accounts`, `refresh_tokens`, `otp_verifications` | Email/SĐT đăng nhập, password hash, refresh token và OTP hash ở Secure DB; OTP có TTL và giới hạn lần thử. |
| Driver | App DB: `driver_profiles` trạng thái/approval, `vehicles` metadata, `driver_locations`. Secure DB: `driver_private_profiles`, thông tin GPLX/định danh và document references | PII và giấy tờ gốc chỉ truy cập qua `driver-service`; `currentLocation` GeoJSON Point có 2dsphere index ở App DB. |
| Booking | `rides`, `ride_offers`, `processed_events` | Ride aggregate giữ state/offer state; state transition có optimistic concurrency |
| Payment | `pricing_configs`, `payments`, `idempotency_records`, `processed_events` | Unique payment theo ride; idempotency theo actor/operation/key |
| Review | `rating_reviews`, `trip_history`, `processed_events` | Unique `rideId` cho rating; history rebuild được từ events |
| Notification | `notifications`, `notification_deliveries`, `processed_events` | Index `(userId, isRead, createdAt)` |
| Admin | `audit_logs`, `admin_projections`, `processed_events` | Audit append-only; projection có thể rebuild |

Mỗi service tạo unique/compound/TTL/geospatial index thuộc dữ liệu nó sở hữu. Không thiết kế MongoDB foreign key giả; service giữ ID và xác minh quyền qua API/event phù hợp.

## 5. Giao tiếp đồng bộ và bất đồng bộ

### 5.1 HTTP/REST

Dùng cho thao tác cần kết quả tức thời: Gateway → service; booking → driver search; payment → pricing/fare; admin → domain command. Internal service endpoints chỉ bind private Docker network. Timeout phải hữu hạn và lỗi upstream được map thành lỗi API ổn định.

### 5.2 RabbitMQ integration events

Dùng topic exchange `cab.events` với routing key theo `context.event-name.vN`, ví dụ `booking.created.v1`. Event là sự kiện đã xảy ra; không dùng event để gửi command. Envelope tối thiểu:

```json
{
  "eventId": "uuid",
  "eventType": "RideCreated",
  "version": 1,
  "occurredAt": "2026-09-30T10:00:00Z",
  "producer": "booking-service",
  "aggregateId": "ride-id",
  "correlationId": "request-or-workflow-id",
  "payload": {}
}
```

| Event | Producer | Consumer ví dụ |
|---|---|---|
| `identity.user-registered.v1` | Auth | Notification, Admin projection; tạo hồ sơ profile nếu có consumer tương ứng |
| `driver.application-submitted.v1`, `driver.approved.v1` | Driver | Admin projection, Notification, Auth entitlement/Notification |
| `driver.availability-changed.v1` | Driver | Booking matching index, Admin projection |
| `booking.created.v1` | Booking | Matching module, Notification, Admin projection |
| `dispatch.offer-sent.v1`, `dispatch.offer-declined.v1`, `dispatch.exhausted.v1` | Booking | Notification, Booking workflow, Admin projection |
| `ride.accepted.v1`, `ride.status-changed.v1`, `ride.cancelled.v1`, `ride.completed.v1` | Booking | Driver state projection, Tracking, Payment, Review eligibility, Notification, Admin projection |
| `payment.completed.v1`, `payment.failed.v1` | Payment | Review eligibility, Notification, Admin projection |
| `rating.submitted.v1` | Review | Driver rating projection, Notification, Admin projection |
| `audit.recorded.v1` | Domain services/Admin | Admin audit store/monitoring; bản ghi audit append-only |

Các event vị trí GPS tần suất cao không nên phát tràn qua RabbitMQ trong MVP. GPS đi qua Socket.IO đến tracking path; chỉ trạng thái/điểm cần cho matching và reporting mới phát event có kiểm soát.

Publisher dùng Outbox pattern hoặc cơ chế tương đương để không commit dữ liệu mà mất event. Consumer phải idempotent theo `eventId`, retry hữu hạn, chuyển message poison vào dead-letter queue và ghi correlation ID. Event chỉ chứa dữ liệu tối thiểu; tuyệt đối không gửi password, OTP plaintext, PAN/CVV hoặc JWT.

### 5.3 Saga cho booking-to-payment

Booking/Dispatch/Trip nằm cùng booking service ở MVP nên lifecycle chuyến không cần distributed saga giữa ba service. Luồng payment là saga bất đồng bộ: `RideCompleted` → Payment tạo pending → provider callback → `PaymentCompleted/Failed`. Payment failure không đưa ride về trạng thái chưa hoàn tất; cho phép retry hoặc cash fallback theo SRS. Timeout/retry cần idempotency key.

## 6. API Gateway, bảo mật và quan sát

Gateway là ingress duy nhất từ client. Nó xác thực JWT signature/issuer/audience/expiry, giới hạn kích thước payload, rate limit, gắn `X-Correlation-ID`, route theo `/api/v1` và không phát lộ service host. Domain service vẫn kiểm tra role và resource ownership để chống IDOR; không tin role/user ID do client tự gửi.

- Password hash bằng bcrypt hoặc Argon2id; không log password/token/OTP.
- `cab-secure-db` chạy trên MongoDB server/cluster riêng trong private subnet/security group tách biệt với App DB. Không publish port ra Internet/host; firewall chỉ cho phép `auth-service` và `driver-service` kết nối đúng port DB.
- Tạo database user riêng cho từng service (`auth_service_rw`, `driver_service_rw`) và giới hạn quyền theo database/collection; ứng dụng không dùng root/admin credential. Secrets được mount từ secret manager hoặc Docker secrets, không nhúng vào image, compose plaintext hay Git.
- Bật TLS cho kết nối service→Secure DB; mã hóa disk và backup; mã hóa trường PII cần đọc lại bằng authenticated encryption, với key lưu/rotate độc lập DB. Bật audit log truy cập dữ liệu nhạy cảm và đặt retention theo chính sách dữ liệu.
- API chỉ trả dữ liệu cần thiết, mask PII theo vai trò/mục đích. Service khác nhận opaque ID hoặc projection tối thiểu qua API/event; không đọc Secure DB trực tiếp. Event/audit không chứa password, token, OTP, ảnh giấy tờ hay PII không cần thiết.
- Dữ liệu nhạy cảm cần đọc lại được mã hóa at rest bằng authenticated encryption; key không nằm cùng DB/repository và phải hỗ trợ xoay key. Hash password không phải encryption.
- MongoDB query phải dùng ODM/allowlist an toàn, reject operator injection; mọi text output được escape để ngăn XSS.
- Checkout bắt buộc `Idempotency-Key`; provider callback kiểm tra HMAC/signature, timestamp và transaction ID. Key lặp payload khác trả 409; cùng payload trả response lưu trước đó.
- Rate limit theo user/IP; vượt ngưỡng trả 429 và `Retry-After`.
- Log JSON có `service`, `requestId`, `correlationId`, `userId` (nếu phù hợp), latency và error code; loại bỏ PII không cần thiết.
- `/health` là liveness; `/ready` xác nhận dependency bắt buộc; `/health/services` tổng hợp trạng thái service. Unhealthy dependency trả 503 nhưng response không chứa secret.

## 7. Docker Compose và triển khai local

Compose tối thiểu gồm `api-gateway`, bảy service backend ở bảng ownership, `cab-app-db`, `cab-secure-db`, `rabbitmq`; ba web app có thể chạy bằng profile riêng. Chỉ Gateway publish API port ra host. App DB, Secure DB, RabbitMQ và backend nằm trong private network; Secure DB ở network segment riêng, chỉ Auth/Driver có route và credentials. Không publish port Secure DB. MongoDB dùng named volume; service có healthcheck/restart policy và chỉ start traffic khi dependency cần thiết healthy. Production đặt hai DB server trong private subnets/security groups riêng; backup Secure DB được mã hóa bằng key độc lập.

Biến môi trường thật nằm ngoài Git. `.gitignore` loại `.env`, `.env.*` trừ `.env.example`, log, build và dependency output. `.env.example` chỉ chứa placeholder. JWT signing key, Mongo credentials, Rabbit credentials và provider secrets không được ghi vào compose hoặc source code dạng plaintext.

Kiểm tra local theo thứ tự:

1. `docker compose up --build` – build/start stack.
2. `docker compose ps` – xem container và health status.
3. Gọi qua Gateway: `GET /health`, `/ready`, `/health/services`.
4. Xác nhận service ports và cả hai MongoDB không được expose trực tiếp ra host; chỉ Auth/Driver kết nối được Secure DB.
5. Chạy Postman smoke flow: customer register/login → driver OTP/application/approval/online → booking/offer/ride → payment callback → review.

## 8. Quy ước trạng thái và lưu ý triển khai

- Public ride status dùng các giá trị trong SRS/API: `requested`, `searching`, `accepted`, `driver_arrived`, `in_progress`, `completed`, `cancelled`/cancellation actor, `no_driver`. API cancellation phải ánh xạ thành `CANCELED` nếu cần theo phiếu chấm; lưu riêng `cancelledBy` và `cancelReason`.
- Driver public availability: `offline`, `available`, `busy`, `suspended`. Client chỉ yêu cầu offline/available; system sở hữu chuyển busy/available khi assign/end/cancel.
- Vehicle type: `sedan`, `suv`, `van`; payment status: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`.
- MongoDB là persistence MVP; PostgreSQL, Redis Geo, Kafka, ClickHouse và search engine không phải dependency bắt buộc trong phiên bản này.
- Socket.IO cung cấp realtime; RabbitMQ vận chuyển integration events. Hai cơ chế này có mục đích khác nhau, không thay thế nhau.
- Bounded context là ranh giới domain logic; không bắt buộc mỗi subdomain nhỏ thành một process/service riêng. Tách service mới chỉ khi có lý do về ownership, scale, reliability hoặc team boundary.

## 9. Đối chiếu với yêu cầu

| Yêu cầu | Thiết kế đáp ứng |
|---|---|
| API Gateway là điểm vào duy nhất | Mục 1, 6, 7 |
| Microservice và data ownership | Mục 1, 2, 4 |
| IPC và message broker | HTTP + RabbitMQ ở mục 5 |
| Health/readiness | Mục 3.5, 6, 7 |
| Payment callback/idempotency | Mục 3.4, 5.3, 6 |
| Nearby drivers, booking history/pagination | Mục 3.2 và API spec |
| OTP onboarding, RBAC, injection/XSS | Mục 3.1, 6 |
| Docker Compose, `.env`, container visibility | Mục 7 |

## 10. Kết luận

MVP giữ bảy service domain/application phía sau Gateway, MongoDB làm persistence và RabbitMQ cho integration events. Booking service hợp nhất booking, matching và trip lifecycle để giảm distributed transaction; Payment service sở hữu pricing/payment; Review service sở hữu rating/history projection; Admin service cung cấp quản trị/audit mà không chiếm quyền sở hữu domain data. Ranh giới này khớp hơn với SRS và API hiện tại, đồng thời vẫn giữ khả năng tách thêm bounded context khi nhu cầu thực tế xuất hiện.
