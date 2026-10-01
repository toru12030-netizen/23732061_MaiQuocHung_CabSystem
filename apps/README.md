# CAB applications

`apps/` chứa các ứng dụng có thể build/deploy độc lập. Mỗi backend service là một package riêng với `src/` và sở hữu domain/data của mình. Skeleton hiện chưa khóa framework hay runtime; thêm manifest và dependency khi chốt stack triển khai.

## Backend services

| Package | Phạm vi |
|---|---|
| `api-gateway` | Ingress HTTP, xác thực JWT, rate limit và định tuyến đến service |
| `auth-service` | Identity, account, OTP và session; PostgreSQL `auth_db` |
| `driver-service` | Driver/fleet, tracking, rating; MongoDB `driver_db` và secure database |
| `booking-service` | Booking/pricing estimate, matching/dispatch và trip lifecycle; PostgreSQL `booking_db` |
| `payment-service` | Fare/payment, provider callback và idempotency; PostgreSQL `payment_db` |
| `notification-service` | Kafka consumers, notification inbox và delivery; MongoDB `notification_db` |
| `admin-service` | Admin APIs, audit và read projections; MongoDB `admin_db` |

Phạm vi hiện tại chỉ gồm backend; không tạo package frontend trong `apps/`.

## Quy ước backend

- `src/routes`: khai báo route và ghép middleware/controller.
- `src/controllers`: chuyển HTTP request/response; không chứa nghiệp vụ cốt lõi.
- `src/services`: orchestration và use cases của service.
- `src/models`: persistence model riêng của service.
- `src/middlewares`: authentication, authorization, validation và error handling.
- `src/config`: cấu hình môi trường, database và logging.
- `src/events`: producer/consumer, event schemas và outbox/inbox adapter.
- `src/modules`: chỉ dùng trong service có nhiều bounded context gắn chặt; mỗi module tự giữ domain logic.

Không import model/database của service khác. Giao tiếp liên service qua HTTP API nội bộ hoặc event contract trong `packages/event-contracts`.
