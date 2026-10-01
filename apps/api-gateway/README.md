# API Gateway

Điểm vào HTTP duy nhất cho các client. Đặt route, JWT validation, rate limit, correlation ID và chuẩn hóa lỗi tại đây. Domain service vẫn chịu trách nhiệm authorization theo resource ownership.

Source layout: `src/routes`, `src/controllers`, `src/middlewares`, `src/config`.
