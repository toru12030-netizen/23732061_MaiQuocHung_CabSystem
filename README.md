# CAB SYSTEM - HỆ THỐNG ĐẶT XE TRỰC TUYẾN THEO KIẾN TRÚC MICROSERVICES

[![Microservices Architecture](https://img.shields.io/badge/Architecture-Microservices-blue.svg)](https://github.com/)
[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-13_Containers-2496ED.svg)](https://www.docker.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_%26_MongoDB-336791.svg)](https://www.postgresql.org/)
[![Message Broker](https://img.shields.io/badge/Messaging-Apache_Kafka-231F20.svg)](https://kafka.apache.org/)
[![Tests Passing](https://img.shields.io/badge/Automated_Tests-100%25_PASS_(30%2F30%20%2B%20Trip%2FAudit)-success.svg)](docs/testing/TEST_REPORT.md)

> **Dự án Môn học:** Kiến trúc Microservices (MSA) — Trường Đại học Công nghiệp TP.HCM (IUH)  
> **Sinh viên thực hiện:** Mai Quốc Hưng  
> **Mã số sinh viên (MSSV):** 23732061  

---

## MỤC LỤC

1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Kiến trúc hệ thống & IPC (Inter-Process Communication)](#2-kiến-trúc-hệ-thống--ipc-inter-process-communication)
3. [Bảng ma trận giao tiếp giữa các Microservices](#3-bảng-ma-trận-giao-tiếp-giữa-các-microservices)
4. [Danh sách Microservices & Cơ sở dữ liệu](#4-danh-sách-microservices--cơ-sở-dữ-liệu)
5. [Công nghệ sử dụng (Tech Stack)](#5-công-nghệ-sử-dụng-tech-stack)
6. [Cấu trúc thư mục (Monorepo Layout)](#6-cấu-trúc-thư-mục-monorepo-layout)
7. [Tài khoản & Dữ liệu mẫu](#7-tài-khoản--dữ-liệu-mẫu)
8. [Hướng dẫn cài đặt & Khởi chạy](#8-hướng-dẫn-cài-đặt--khởi-chạy)
9. [Kiểm thử tự động (Automated Testing)](#9-kiểm-thử-tự-động-automated-testing)
10. [Kiểm thử thủ công qua Postman (Manual Testing)](#10-kiểm-thử-thủ-công-qua-postman-manual-testing)
11. [Bảo mật hệ thống (Security Implementations)](#11-bảo-mật-hệ-thống-security-implementations)
12. [Đường ống CI/CD (GitHub Actions)](#12-đường-ống-cicd-github-actions)
13. [Tài liệu tham khảo liên quan](#13-tài-liệu-tham-khảo-liên-quan)

---

## 1. GIỚI THIỆU TỔNG QUAN

**CAB System** là nền tảng đặt xe trực tuyến mô phỏng các dịch vụ gọi xe công nghệ hiện đại (Grab, Gojek, Be) được thiết kế và triển khai hoàn chỉnh theo **Kiến trúc Microservices (MSA)** và mô hình **Clean Architecture**:

- Mỗi dịch vụ nghiệp vụ là một đơn vị độc lập, sở hữu cơ sở dữ liệu riêng biệt (**Database per Service**).
- Giao tiếp linh hoạt kết hợp giữa **gRPC** (gọi nội bộ đồng bộ hiệu năng cao), **REST API** (qua API Gateway) và **Apache Kafka** (truyền thông điệp sự kiện bất đồng bộ).
- Hệ thống hỗ trợ đầy đủ luồng nghiệp vụ: Đăng ký/đăng nhập tài khoản, quản lý hồ sơ tài xế và xét duyệt, tìm tài xế gần nhất theo thuật toán bán kính GeoJSON (1km), đặt xe, điều hướng trạng thái chuyến đi (Arrived, In Progress, Completed, Cancelled), **Trip Execution & GPS Tracking**, **Centralized Audit Logging**, thanh toán trực tuyến Idempotency và đánh giá chuyến đi (Rating 1-5 sao).
- Đáp ứng chuẩn xác **30/30 tiêu chí đánh giá** trong [`phieucham.md`](phieucham.md).

---

## 2. KIẾN TRÚC HỆ THỐNG & IPC (INTER-PROCESS COMMUNICATION)

### Sơ đồ tương tác toàn diện giữa các Microservices:

```text
                           [ Web / Mobile Client / Postman ]
                                          │
                                          ▼ (HTTP/1.1 REST / Port 3000)
                     ┌──────────────────────────────────────────────┐
                     │                 API GATEWAY                  │
                     │  - Reverse Proxy Routing                     │
                     │  - Global & Sensitive Rate Limiting (STT 29) │
                     │  - Request Input XSS Sanitization (STT 26)   │
                     │  - Unique Correlation ID Tracking            │
                     │  - RBAC Role Hierarchy Authorization (STT 28)│
                     └──────────────────────┬───────────────────────┘
                                            │
        ┌──────────────────┬────────────────┼─────────────────┬──────────────────┐
        │ gRPC: 50051      │ gRPC: 50052    │ REST Proxy      │ REST Proxy       │ REST Proxy
        ▼                  ▼                ▼                 ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────┐    ┌─────────────┐    ┌─────────────┐
│  Auth Service │  │ Customer Svc  │  │Booking Svc│    │  Driver Svc │    │ Payment Svc │
│ (auth_db - PG)│  │(customer_db)  │  │(booking_db│    │ (driver_db) │    │(payment_db) │
└───────┬───────┘  └───────┬───────┘  └─────┬─────┘    └──────┬──────┘    └──────┬──────┘
        │                  │                │                 │                  │
        │                  │                │ REST / Event    │                  │
        │                  │                ▼                 │                  │
        │                  │         ┌─────────────┐          │                  │
        │                  │         │  Trip Svc   │◄─────────┘                  │
        │                  │         │  (trip_db)  │ (Location / Status)         │
        │                  │         └──────┬──────┘                             │
        │                  │                │                                    │
        │                  │                │ REST / RBAC                        │
        │                  │                ▼                                    │
        │                  │         ┌─────────────┐                             │
        │                  │         │  Audit Svc  │ (Centralized Logs &         │
        │                  │         │ (audit_db)  │  Security Events)           │
        │                  │         └──────┬──────┘                             │
        │                  │                │                                    │
        │                  │                ▼                                    │
        │                  │         ┌─────────────┐                             │
        │                  │         │  Admin Svc  │                             │
        │                  │         │ (admin_db)  │                             │
        │                  │         └──────┬──────┘                             │
        │                  │                │                                    │
        ▼                  ▼                ▼                 ▼                  ▼
 ═════════════════════════════════════════════════════════════════════════════════════════
                       APACHE KAFKA EVENT BROKER (cab-kafka:9092)
     Topics: ride.events | trip.events | payment.events | audit.events | notifications
 ═════════════════════════════════════════════════════════════════════════════════════════
                                            │
                                            ▼ (Event Consumer)
                                 ┌──────────────────────┐
                                 │ Notification Service │
                                 │  (notification_db)   │
                                 └──────────────────────┘
```

---

## 3. BẢNG MA TRẬN GIAO TIẾP GIỮA CÁC MICROSERVICES

Hệ thống kết hợp chặt chẽ 3 phương thức giao tiếp liên dịch vụ (IPC) phù hợp với từng bài toán kỹ thuật:

| Dịch vụ gửi (Caller) | Dịch vụ nhận (Callee) | Phương thức giao tiếp (IPC) | Giao thức / Port | Nội dung / Mục đích giao tiếp |
|---|---|:---:|:---:|---|
| **Client / Postman** | **API Gateway** | **HTTP REST** | HTTP/1.1 :3000 | Tiếp nhận mọi request từ người dùng, gắn `X-Correlation-Id`, kiểm tra Rate limit và lọc mã độc XSS. |
| **API Gateway** | **Auth Service** | **gRPC** | HTTP/2 :50051 (Protobuf) | `ValidateToken`: Xác thực token JWT, kiểm tra thời hạn và đối chiếu token blacklist khi logout với độ trễ siêu thấp. |
| **API Gateway** | **Customer Service** | **gRPC** | HTTP/2 :50052 (Protobuf) | `GetCustomerProfile`, `CreateCustomerProfile`: Cung cấp thông tin khách hàng cho Gateway. |
| **API Gateway** | **Driver Service** | **HTTP REST Proxy** | HTTP/1.1 :3002 | Tìm tài xế xung quanh 1km (`/drivers/nearby`), lấy chi tiết tài xế, nhận đánh giá chuyến đi (`/rides/:id/rating`). |
| **API Gateway** | **Booking Service** | **HTTP REST Proxy** | HTTP/1.1 :3003 | Khởi tạo booking đặt xe (`POST /bookings`), tài xế nhận cuốc (`/accept`), cập nhật trạng thái, hủy chuyến (`/cancel`). |
| **API Gateway** | **Trip Service** | **HTTP REST Proxy** | HTTP/1.1 :3008 | Gửi tọa độ GPS thực tế (`/trips/:id/location`), cập nhật trạng thái di chuyển, lấy lộ trình breadcrumbs và ETA. |
| **API Gateway** | **Payment Service** | **HTTP REST Proxy** | HTTP/1.1 :3004 | Khởi tạo thanh toán online (`/checkout`), nhận Webhook kết quả (`/callback`), kiểm tra Idempotency chống Replay Attack. |
| **API Gateway** | **Admin Service** | **HTTP REST Proxy** | HTTP/1.1 :3006 | Phân quyền RBAC Admin duyệt hồ sơ tài xế (`/admin/drivers/:id/approval`), quản lý cấu hình giá cước. |
| **API Gateway** | **Audit Service** | **HTTP REST Proxy** | HTTP/1.1 :3009 | Admin tra cứu nhật ký kiểm toán hệ thống (`/admin/audit-logs`) và xem danh sách sự kiện an ninh bảo mật. |
| **Booking Service** | **Driver Service** | **HTTP REST (Internal)** | HTTP/1.1 :3002 | Lấy danh sách ứng viên tài xế gần điểm đón trong bán kính 1km để phát Offer cuốc xe. |
| **Booking Service** | **Trip Service / Kafka** | **Kafka Event** | TCP :9092 (`ride.events`) | Phát sự kiện `RIDE_ASSIGNED` khi tài xế nhận chuyến để `trip-service` tự động khởi tạo Trip. |
| **Trip Service** | **Kafka Broker** | **Kafka Event** | TCP :9092 (`trip.events`) | Phát sự kiện `TRIP_CREATED`, `TRIP_LOCATION_UPDATED`, `TRIP_STATUS_UPDATED` cho các bên tiêu thụ. |
| **Payment Service** | **Kafka Broker** | **Kafka Event** | TCP :9092 (`payment.events`)| Phát sự kiện `PAYMENT_COMPLETED` khi giao dịch thanh toán trực tuyến thành công. |
| **Tất cả Services** | **Audit Service** | **Kafka Event** | TCP :9092 (`audit.events`) | Ghi nhận bất đồng bộ các hành động nhạy cảm (duyệt hồ sơ, thanh toán, thay đổi trạng thái) vào `audit_db`. |
| **Kafka Broker** | **Notification Service** | **Kafka Event Consumer** | TCP :9092 | Lắng nghe các topics sự kiện để lưu và phát thông báo (push notification/SMS) cho khách hàng & tài xế. |

---

## 4. DANH SÁCH MICROSERVICES & CƠ SỞ DỮ LIỆU

Hệ thống bao gồm **10 Microservices nghiệp vụ** và **3 dịch vụ hạ tầng** được đóng gói hoàn chỉnh trong cụm 13 containers Docker:

| Container Name | Service Name | Cổng (Port) | Cơ sở dữ liệu | Nhiệm vụ chính |
|---|---|:---:|---|---|
| `cab-api-gateway` | **API Gateway** | **3000** | - | Điểm đón duy nhất (Single Entry Point), Reverse proxy, gRPC client, Rate limit (STT 29), XSS Sanitizer (STT 26), Correlation ID (STT 08). |
| `cab-auth-service` | **Auth Service** | **3001** / `50051` (gRPC) | PostgreSQL (`auth_db`) | Quản lý định danh, đăng ký, đăng nhập, cấp JWT, blacklist token, mã hóa BCrypt at rest (STT 24), phòng chống SQL Injection (STT 25). |
| `cab-customer-service` | **Customer Service** | **3007** / `50052` (gRPC) | MongoDB (`customer_db`) | Quản lý thông tin hồ sơ khách hàng, gRPC server cung cấp profile khách hàng. |
| `cab-driver-service` | **Driver Service** | **3002** | MongoDB (`driver_db`) | Quản lý tài xế, tọa độ vị trí GeoJSON, tìm xe quanh 1km (STT 13), quản lý đánh giá chuyến đi (Rating STT 20). |
| `cab-booking-service` | **Booking Service** | **3003** | PostgreSQL (`booking_db`) | Quản lý vòng đời chuyến xe: tạo booking, matching tài xế, accept, cập nhật status (STT 17), hủy chuyến (STT 18). |
| `cab-trip-service` | **Trip Service** *(Mới)* | **3008** | MongoDB (`trip_db`) | **Quản lý thực thi chuyến đi (Trip Execution)**, lưu vết lộ trình GPS thời gian thực (Breadcrumbs), tính toán ETA di chuyển. |
| `cab-payment-service` | **Payment Service** | **3004** | PostgreSQL (`payment_db`) | Bảng giá, thanh toán online (STT 19), Webhook callback, cơ chế Idempotency chống Replay Attack (STT 30). |
| `cab-audit-service` | **Audit Service** *(Mới)* | **3009** | PostgreSQL (`audit_db`) | **Kiểm toán tập trung & Bất biến (Immutable Audit Logging)**, lưu trữ nhật ký tuân thủ PCI-DSS/ISO 27001, cấm sửa/xóa qua trigger, phát hiện và lưu vết các sự kiện an ninh bảo mật (SQLi, XSS, Tampered Token). |
| `cab-notification-service`| **Notification Service** | **3005** | MongoDB (`notification_db`) | Tiêu thụ event từ Kafka, lưu và đẩy thông báo cho tài xế và khách hàng. |
| `cab-admin-service` | **Admin Service** | **3006** | MongoDB (`admin_db`) | Xét duyệt hồ sơ tài xế (STT 22), phân quyền RBAC (STT 28), quản trị hệ thống. |
| `cab-kafka` | **Apache Kafka Broker** | **9092** | - | Message Broker phân tán quản lý luồng sự kiện liên dịch vụ (STT 07). |
| `cab-zookeeper` | **Zookeeper** | **2181** | - | Quản lý cấu hình cụm và trạng thái broker Kafka. |
| `cab-secure-db` | **Secure Mongo Replica** | **27017** | MongoDB | Lưu trữ dữ liệu an toàn tách biệt qua mạng nội bộ cô lập `cab-secure-net`. |

---

## 5. CÔNG NGHỆ SỬ DỤNG (TECH STACK)

- **Backend Runtime:** Node.js (v20+ / v26)
- **Framework & Protocols:** Express.js, `@grpc/grpc-js`, `@grpc/proto-loader` (Protobuf v3)
- **Database & Storage:**
  - **PostgreSQL 15+:** Lưu trữ dữ liệu quan hệ và nhật ký kiểm toán bất biến (`auth_db`, `booking_db`, `payment_db`, `audit_db`).
  - **MongoDB 7.0:** Lưu trữ tài liệu phi cấu trúc & GeoJSON Index 2dsphere (`customer_db`, `driver_db`, `trip_db`, `notification_db`, `admin_db`).
- **Distributed Streaming:** Apache Kafka (Confluent cp-kafka:7.6.0) & Zookeeper.
- **Containerization & Orchestration:** Docker & Docker Compose v2.
- **Bảo mật:** BCrypt (10 rounds), JSON Web Token (HS256 với Role Hierarchy), Express Rate Limit, Custom XSS Sanitizer, Parametrized SQL Queries, Idempotency-Key Header.
- **Testing Engine:** Node.js Native Test Runner (`node:test`, `node:assert`), Axios HTTP Client.
- **CI/CD:** GitHub Actions.

---

## 6. CẤU TRÚC THƯ MỤC (MONOREPO LAYOUT)

```text
23732061_MaiQuocHung_CabSystem/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Pipeline CI GitHub Actions: Build, Up, Seed, Test, Upload Report
│       └── cd.yml                 # Pipeline CD GitHub Actions: Build 10 images, Tag SHA & latest, Push Registry
├── apps/
│   ├── api-gateway/               # API Gateway (Express, gRPC clients, proxy routing, middlewares)
│   ├── auth-service/              # Auth Service (PostgreSQL auth_db, gRPC server 50051)
│   ├── customer-service/          # Customer Service (MongoDB customer_db, gRPC server 50052)
│   ├── driver-service/            # Driver Service (MongoDB driver_db, GeoJSON, Rating)
│   ├── booking-service/           # Booking Service (PostgreSQL booking_db, State Machine)
│   ├── trip-service/              # Trip Service (MongoDB trip_db, GPS Breadcrumbs, Execution)
│   ├── payment-service/           # Payment Service (PostgreSQL payment_db, Idempotency)
│   ├── audit-service/             # Audit Service (PostgreSQL audit_db, Centralized Logging & Immutable Triggers)
│   ├── notification-service/      # Notification Service (MongoDB notification_db, Kafka Consumer)
│   └── admin-service/             # Admin Service (MongoDB admin_db, Driver Approval, RBAC)
├── packages/
│   ├── proto/                     # Protocol Buffers (.proto) dùng chung cho gRPC
│   │   ├── auth.proto
│   │   └── customer.proto
│   ├── shared-config/             # Utilities, constants, gRPC loader, standard response helpers
│   └── event-contracts/           # Định nghĩa schemas sự kiện Kafka
├── infra/
│   ├── postgres/                  # SQL Schemas cho auth_db, booking_db, payment_db
│   └── mongo/                     # Scripts khởi tạo collections và GeoJSON 2dsphere Index
├── tests/                         # BỘ KIỂM THỬ TỰ ĐỘNG CHO 30 TIÊU CHÍ (PHIEUCHAM.MD)
│   ├── infrastructure/            # STT 01 - 05, 07: Cấu trúc, .env, Gateway, IPC, Containers, Kafka
│   ├── smoke/                     # STT 06, 08: /health, /ready, /health/services, Headers
│   ├── integration/               # STT 09 - 14, 21 - 23: Auth, Query, Driver OTP, Admin Approval
│   │   ├── auth-query.test.js
│   │   ├── driver-admin.test.js
│   │   └── trip-audit.test.js     # Kiểm thử Trip Service & Audit Service
│   ├── e2e/                       # STT 15 - 20: Booking Lifecycle, State transitions, Payment, Rating
│   ├── security/                  # STT 24 - 30: Encryption, SQLi, XSS, JWT Tampering, RBAC, Rate Limit, Replay
│   ├── helpers/                   # API client, Auth helper, Master runner
│   └── fixtures/                  # Tọa độ ĐH IUH, accounts mẫu, malicious payloads
├── scripts/
│   ├── seed-data.js               # Script tạo dữ liệu mẫu toàn diện cho PostgreSQL & MongoDB
│   └── init-ci-databases.js       # Script khởi tạo cơ sở dữ liệu trên CI Runner
├── test-results/
│   └── summary.json               # Kết quả tổng kết kiểm thử định dạng JSON
├── docs/                          # THƯ MỤC TÀI LIỆU TOÀN DIỆN DỰ ÁN
│   ├── README.md                  # Mục lục điều hướng tài liệu
│   ├── architecture/
│   │   └── micro_service_design.md# Tài liệu thiết kế hệ thống Microservices & DDD v3.0
│   ├── specs/
│   │   ├── srs.md                 # Đặc tả yêu cầu phần mềm v3.0
│   │   └── phieucham.md           # 30 tiêu chí đánh giá môn học
│   └── testing/
│       ├── DU_LIEU_TEST_MAU_THEO_TIEU_CHI.md # Dữ liệu mẫu gõ tay Postman theo từng tiêu chí
│       ├── CAB_Test_Cases.xlsx    # Bảng test cases chi tiết
│       ├── HUONG_DAN_TEST_THU_CONG.md # Hướng dẫn test Postman thủ công từng bước
│       ├── DANH_SACH_API_TEST.md  # Danh sách API và payload mẫu test Postman
│       └── TEST_REPORT.md         # Báo cáo kết quả kiểm thử tự động 100%
├── api-docs/                      # Đặc tả OpenAPI 3.0.3 tổng thể & module
├── docker-compose.yml             # Cấu hình khởi chạy toàn bộ cụm 13 containers
└── package.json                   # Root package quản lý workspaces và các lệnh test
```

---

## 7. TÀI KHOẢN & DỮ LIỆU MẪU

Dữ liệu mẫu chuẩn bị sẵn khi chạy `npm run seed`:

| Vai trò | Username | Password | Mã định danh (ID) | Ghi chú |
|---|---|---|---|---|
| **Khách hàng** | `customer1` | `Password123@` | `usr_cust_001` | Role: `member`, có sẵn >= 5 chuyến xe |
| **Quản trị viên** | `admin_hung` | `Password123@` | `usr_admin_001` | Role: `admin` |
| **Tài xế 1** | `driver_tuan` | `Password123@` | `DRV_001` | Status: `AVAILABLE` (Gần ĐH IUH 1km) |
| **Tài xế 2** | `driver_nam` | `Password123@` | `DRV_002` | Status: `BUSY` |
| **Tài xế chờ duyệt** | - | - | `DRV_006` | Status: `PENDING_APPROVAL` (Dùng test duyệt hồ sơ) |
| **Chuyến xe mẫu** | - | - | `ride_demo_001` | Sẵn sàng cho test Accept / Payment / Rating |
| **Chuyến đi mẫu** | - | - | `trip_demo_001` | Có sẵn GPS breadcrumb trong `trip_db` |
| **Mã OTP mặc định** | - | - | `123456` | Dùng xác thực đăng ký tài xế mới |

---

## 8. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY

### 1. Yêu cầu môi trường (Prerequisites)
- **Node.js:** Phiên bản `>= 20.x` (khuyến nghị Node 20 LTS hoặc cao hơn).
- **Docker & Docker Compose:** Đã cài đặt và đang chạy Docker Desktop.
- **Git**

### 2. Cài đặt các gói phụ thuộc (Dependencies)
```bash
git clone <repository-url>
cd 23732061_MaiQuocHung_CabSystem
npm install
```

### 3. Khởi động toàn bộ hệ thống
```bash
# Khởi chạy 13 containers nền qua Docker Compose
npm start
# (Tương đương: docker compose up -d)

# Kiểm tra trạng thái các container đang hoạt động
npm run status
# (Tương đương: docker compose ps)

# Xem log thời gian thực của các dịch vụ
npm run logs
```

### 4. Khởi tạo dữ liệu mẫu (Seed Data)
```bash
npm run seed
```
> Lệnh này sẽ kết nối đến PostgreSQL và MongoDB để tạo đầy đủ dữ liệu mẫu cho các cơ sở dữ liệu (**PostgreSQL:** `auth_db`, `booking_db`, `payment_db`, `audit_db`; **MongoDB:** `customer_db`, `driver_db`, `trip_db`, `notification_db`, `admin_db`).

### 5. Tắt hệ thống
```bash
npm run stop
# (Tương đương: docker compose down)
```

---

## 9. KIỂM THỬ TỰ ĐỘNG (AUTOMATED TESTING)

Bộ test tự động kiểm tra thực tế trên hệ thống đang chạy qua Gateway, không dùng mock giả lập, bảo đảm 100% tính chân thực.

### Chạy toàn bộ Test Suites:
```bash
npm test
```
*Kết quả hiển thị trên terminal:*
```text
======================================================================
🚀 IUH MSA CAB SYSTEM - AUTOMATED TEST RUNNER (PHIEUCHAM.MD)
   Author: Mai Quoc Hung - MSSV: 23732061
======================================================================

▶ Executing: [STT 01 - 05, 07] Infrastructure & Architecture ...
  ✅ PASSED (332ms)

▶ Executing: [STT 06, 08] Smoke Health & Gateway ...
  ✅ PASSED (204ms)

▶ Executing: [STT 09 - 14] Authentication & Query ...
  ✅ PASSED (548ms)

▶ Executing: [STT 15 - 20] E2E Booking & Ride Lifecycle ...
  ✅ PASSED (372ms)

▶ Executing: [STT 21 - 23] Driver Registration & Admin Approval ...
  ✅ PASSED (261ms)

▶ Executing: [STT 24 - 30] Security & Vulnerability ...
  ✅ PASSED (367ms)

▶ Executing: [Trip & Audit] Trip & Audit Services ...
  ✅ PASSED (360ms)

======================================================================
📊 TEST EXECUTION SUMMARY:
   Suites Passed: 7 / 7
   Suites Failed: 0 / 7
   Result Saved:  test-results/summary.json
======================================================================

🎉 ALL AUTOMATED TEST SUITES PASSED 100% FOR PHIEUCHAM.MD!
```

### Chạy từng nhóm kiểm thử riêng lẻ:
```bash
# 1. Kiểm tra Kiến trúc, Git, Docker, Kafka (STT 01 - 05, 07)
npm run test:infrastructure

# 2. Kiểm tra Health check, Gateway routing (STT 06, 08)
npm run test:smoke

# 3. Kiểm tra Đăng ký, Đăng nhập, Truy vấn (STT 09 - 14)
npm run test:integration

# 4. Kiểm tra Luồng đặt xe E2E (STT 15 - 20)
npm run test:e2e

# 5. Kiểm tra An ninh & Bảo mật (STT 24 - 30)
npm run test:security
```

---

## 10. KIỂM THỬ THỦ CÔNG QUA POSTMAN (MANUAL TESTING)

Để phục vụ trình diễn và chấm điểm trực tiếp với Giảng viên, dự án cung cấp bộ file Postman chuẩn đã được làm sạch hoàn toàn:

1. **File Collection:** [`CAB_System_IUH.postman_collection.json`](CAB_System_IUH.postman_collection.json) (Bao gồm đầy đủ các requests được nhóm đúng theo 3 phần thực hành).
2. **File Environment:** [`CAB_System_IUH.postman_environment.json`](CAB_System_IUH.postman_environment.json) (Chứa biến `base_url: http://localhost:3000/api/v1`, `jwt_customer`, `jwt_admin`).
3. **Tài liệu hướng dẫn thao tác:** Xem chi tiết tại [`HUONG_DAN_TEST_THU_CONG.md`](HUONG_DAN_TEST_THU_CONG.md).
4. **Danh sách chi tiết toàn bộ API:** Xem tại [`DANH_SACH_API_TEST.md`](DANH_SACH_API_TEST.md).

---

## 11. BẢO MẬT HỆ THỐNG (SECURITY IMPLEMENTATIONS)

Hệ thống hiện thực hóa đầy đủ 7 cơ chế an toàn thông tin theo yêu cầu của Thực hành 3:

1. **Data Encryption at Rest (STT 24):** Mật khẩu người dùng trong PostgreSQL `auth_db.users` được băm bằng thuật toán **BCrypt (10 rounds)** dạng `$2a$10$...`. Tuyệt đối không lưu plaintext.
2. **SQL Injection Protection (STT 25):** Sử dụng câu truy vấn tham số hóa (Parameterized Queries `$1, $2`). Payload `' OR 1=1 --` bị xử lý như chuỗi ký tự thông thường, trả về `HTTP 401 Unauthorized` và không làm rò rỉ cấu trúc database.
3. **XSS Sanitization (STT 26):** Middleware `xssSanitizer` tại API Gateway tự động quét và lọc sạch các cặp thẻ `<script>...</script>` và mã HTML độc hại trước khi chuyển tiếp vào các dịch vụ phía sau.
4. **JWT Signature Verification (STT 27):** Token bị sửa đổi payload hoặc chữ ký giả mạo lập tức bị gRPC `ValidateToken` phát hiện và từ chối với `HTTP 401 INVALID_TOKEN`, ngăn chặn hoàn toàn việc nâng quyền trái phép.
5. **Role-Based Access Control - RBAC (STT 28):** Middleware `requireRoles` tại API Gateway phân quyền chặt chẽ theo thứ bậc: Khách hàng (role `member`) gọi API Quản trị viên (`/admin/*`) hoặc Audit Logs (`/admin/audit-logs`) sẽ bị chặn ngay với `HTTP 403 Forbidden`.
6. **Rate Limiting (STT 29):** Thiết lập 2 tầng giới hạn tại Gateway:
   - Toàn hệ thống: Tối đa 1000 requests / 15 phút.
   - Endpoint nhạy cảm (`POST /bookings`): Tối đa 10 requests / 15 giây. Khi bị spam, Gateway trả về `HTTP 429 Too Many Requests`.
7. **Idempotency & Replay Attack Defense (STT 30):** API thanh toán hỗ trợ header `Idempotency-Key` (kết hợp băm nội dung). Khi nhận cùng một request thanh toán lặp lại, hệ thống trả về kết quả đã lưu trong bộ nhớ đệm và **không tạo giao dịch mới, không trừ tiền hai lần**.

---

## 12. ĐƯỜNG ỐNG CI/CD (GITHUB ACTIONS)

Dự án thiết lập 2 quy trình tự động hóa độc lập trong thư mục [`.github/workflows/`](.github/workflows/):

### 1. CI Pipeline (`.github/workflows/ci.yml`)
- **Kích hoạt:** Khi có `push` hoặc `pull_request` vào nhánh `main` / `master`, hoặc chạy thủ công (`workflow_dispatch`).
- **Các bước thực thi:**
  1. Checkout repository & thiết lập Node.js 20.
  2. Khởi chạy 2 service container: PostgreSQL 15 và MongoDB 7.0 trên runner.
  3. Chạy `node scripts/init-ci-databases.js` để tự động tạo cơ sở dữ liệu và nạp schemas.
  4. Khởi động cụm microservices qua `docker compose up -d --build`.
  5. Thăm dò và đợi API Gateway báo `ready` qua cơ chế retry thông minh.
  6. Chạy `npm run seed` nạp dữ liệu mẫu ban đầu.
  7. Thực thi toàn bộ kiểm thử tự động `npm test` (STT 01 - STT 30 + Trip/Audit).
  8. Xuất và lưu trữ báo cáo kiểm thử `test-results/` vào GitHub Actions Artifacts.
  9. Dọn dẹp tài nguyên (`docker compose down -v`).

### 2. CD Pipeline (`.github/workflows/cd.yml`)
- **Kích hoạt:** Tự động lắng nghe sự kiện CI hoàn thành thành công (`workflow_run` với conclusion `success`).
- **Nhiệm vụ:**
  1. Build Docker images cho toàn bộ 10 dịch vụ bằng Matrix Strategy:
     - `cab-api-gateway`, `cab-auth-service`, `cab-customer-service`, `cab-driver-service`
     - `cab-booking-service`, `cab-trip-service`, `cab-payment-service`, `cab-audit-service`
     - `cab-notification-service`, `cab-admin-service`
  2. Gắn tag kép: `:latest` và `:<commit-sha>`.
  3. Đăng nhập và đẩy (Push) images lên Docker Hub sử dụng GitHub Secrets:
     - `DOCKERHUB_USERNAME`: Tên tài khoản Docker Hub.
     - `DOCKERHUB_TOKEN`: Personal Access Token từ Docker Hub.

---

## 13. TÀI LIỆU THAM KHẢO LIÊN QUAN

- 📄 **Báo cáo chi tiết kiểm thử tự động:** [`TEST_REPORT.md`](TEST_REPORT.md)
- 📋 **Bảng tiêu chí chấm điểm môn học:** [`phieucham.md`](phieucham.md)
- 📑 **Đặc tả yêu cầu phần mềm:** [`srs.md`](srs.md)
- 📜 **Đặc tả OpenAPI / Swagger các dịch vụ:** Thư mục [`api-docs/`](api-docs/)
- 🎯 **Danh mục API test thủ công:** [`DANH_SACH_API_TEST.md`](DANH_SACH_API_TEST.md)
- 🧭 **Hướng dẫn test Postman từng bước:** [`HUONG_DAN_TEST_THU_CONG.md`](HUONG_DAN_TEST_THU_CONG.md)

---
*© 2026 - Dự án Kiến trúc Microservices (IUH) - Sinh viên: Mai Quốc Hưng (MSSV: 23732061).*