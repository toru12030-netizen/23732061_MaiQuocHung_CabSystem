# CAB System API

Tài liệu API OpenAPI 3.0.3 cho nền tảng CAB. Các file được chia theo nhóm nghiệp vụ và ánh xạ yêu cầu chức năng bằng extension `x-fr-ids`. Nhóm tài liệu không đại diện cho một service/process riêng.

## Kiến trúc triển khai

Client chỉ gọi public API qua `api-gateway` tại `http://localhost:3000/api/v1`. Gateway xác thực JWT, áp dụng chính sách ingress và định tuyến đến service sở hữu nghiệp vụ. Các service giữ database riêng; không đọc trực tiếp database của service khác. Giao tiếp nội bộ dùng HTTP khi cần phản hồi đồng bộ và Kafka cho integration events.

| File | Phạm vi API | Runtime owner |
|---|---|---|
| `01-auth.yaml` | Account, OTP, đăng nhập, profile, session | `auth-service` |
| `02-driver-vehicle.yaml` | Hồ sơ, phương tiện, trạng thái, duyệt và khóa tài xế | `driver-service`; đăng ký/OTP thuộc `auth-service` |
| `03-ride-booking.yaml` | Estimate, ride, lịch sử, hủy và lifecycle | `booking-service` |
| `04-matching.yaml` | Offers, accept/decline, retry và matching status | `booking-service` (matching module) |
| `05-payment.yaml` | Pricing, fare, checkout, callback và cash confirmation | `payment-service` |
| `06-tracking.yaml` | Nearby drivers, GPS, ride location và operations map | `driver-service` |
| `07-notification.yaml` | Notification inbox và read state | `notification-service` |
| `08-rating.yaml` | Review và rating tài xế | `driver-service` (rating module) |
| `09-admin.yaml` | Dashboard, search, reports và yêu cầu can thiệp | `admin-service`; lệnh nghiệp vụ được chuyển tới service owner |
| `10-security-audit.yaml` | Audit log và health/readiness | Audit: `admin-service`; health tổng hợp: `api-gateway` |

Runtime gồm `api-gateway` và sáu domain services: `auth-service`, `driver-service`, `booking-service`, `payment-service`, `notification-service`, `admin-service`. Booking, Matching và Trip Execution cùng nằm trong `booking-service`; Tracking và Rating cùng nằm trong `driver-service` ở MVP.

`openapi.yaml` là hợp đồng tổng hợp để import Swagger/Postman và phải đồng bộ với các file module. Nếu phần mô tả trong tài liệu này khác schema/path/response của OpenAPI, dùng OpenAPI làm nguồn chuẩn. `api-specs.md` là hướng dẫn đọc và kiểm thử hợp đồng.

## Xác thực và kiểm thử

Các endpoint được bảo vệ dùng JWT Bearer, trừ các endpoint được OpenAPI mô tả công khai như đăng ký, đăng nhập và health check. Trong Swagger UI, gọi `POST /auth/login`, nhấn **Authorize** và nhập access token.

Smoke flow chính: customer đăng ký/đăng nhập; driver OTP → nộp hồ sơ → admin duyệt → online; customer tạo ride → driver nhận offer → cập nhật lifecycle; payment checkout/callback hoặc cash confirmation; sau đó gửi rating. Checkout cần `Idempotency-Key`; callback phải xác minh chữ ký và chống xử lý lặp.

Có thể mở `openapi.yaml` bằng Swagger Editor/UI hoặc import vào Postman/Insomnia. Các file module dùng để tra cứu theo nghiệp vụ; chúng không khai báo service host riêng và không nên được hiểu là endpoint truy cập trực tiếp service nội bộ.
