# CAB System – Documentation Hub

Thư mục tập trung toàn bộ tài liệu đặc tả, thiết kế kiến trúc và hướng dẫn kiểm thử của dự án **CAB System (Hệ thống đặt xe trực tuyến theo kiến trúc Microservices)**.

---

## 1. Thiết kế Kiến trúc (`docs/architecture/`)
- [micro_service_design.md](architecture/micro_service_design.md): Tài liệu thiết kế hệ thống Microservices & Domain-Driven Design (DDD) v3.0, phân rã 10 microservices, Context Map, Sequence Diagram, cơ chế IPC (REST, gRPC, Kafka) và phân vùng lưu trữ Database-per-Service.

---

## 2. Đặc tả Nghiệp vụ & Tiêu chuẩn Đánh giá (`docs/specs/`)
- [srs.md](specs/srs.md): Software Requirements Specification (SRS) v3.0 chi tiết các yêu cầu chức năng (FR) và phi chức năng (NFR).
- [phieucham.md](specs/phieucham.md): Bảng 30 tiêu chí đánh giá và chấm điểm đồ án kiến trúc Microservices.

---

## 3. Cẩm nang & Báo cáo Kiểm thử (`docs/testing/`)
- [CAB_Test_Cases.xlsx](testing/CAB_Test_Cases.xlsx): Bảng ma trận kiểm thử chi tiết (Test Case Matrix) tương ứng với từng ca kiểm thử.
- [HUONG_DAN_TEST_THU_CONG.md](testing/HUONG_DAN_TEST_THU_CONG.md): Hướng dẫn từng bước thực hiện kiểm thử thủ công qua Postman (đầy đủ các bước đăng nhập, cấp token, đặt xe, thanh toán).
- [DANH_SACH_API_TEST.md](testing/DANH_SACH_API_TEST.md): Danh mục các endpoint, headers và body payload chuẩn để import vào Postman hoặc cURL.
- [TEST_REPORT.md](testing/TEST_REPORT.md): Báo cáo chi tiết kết quả chạy kiểm thử tự động (Automated Test Execution Report) đạt 100% tỷ lệ vượt qua (Pass).

---

## 4. Hợp đồng API OpenAPI (`api-docs/`)
- [api-docs/](../api-docs/): Toàn bộ đặc tả OpenAPI 3.0.3 (`openapi.yaml`) và các file yaml chia theo từng nghiệp vụ.
