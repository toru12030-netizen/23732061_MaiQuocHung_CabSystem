# CAB Platform - OpenAPI 3.0.3 Specifications

Welcome to the API specification repository for the **CAB System** (Online Ride-Hailing Platform). This repository contains the complete API design using **OpenAPI 3.0.3**, partitioned into modular domain files. Each endpoint is mapped directly to the project's Functional Requirements via custom `x-fr-ids` extensions.

---

## 📁 Repository Structure & Modules

The API specifications are organized into 10 dedicated functional modules:

1. **`01-auth.yaml`** – **Authentication & Account Management** (`FR-AUTH-01` to `FR-AUTH-06`)
   * Customer and driver registration, user login (`AuthSession`), profile updates, password changes, and token revocation/logout.
2. **`02-driver-vehicle.yaml`** – **Drivers & Vehicles** (`FR-DRV-01` to `FR-DRV-06`)
   * Vehicle registration, status management (`offline`, `available`), driver performance metrics, operator application reviews, and suspension controls.
3. **`03-ride-booking.yaml`** – **Ride Booking & Lifecycle** (`FR-RIDE-01` to `FR-RIDE-09`)
   * Route/fare estimation, ride creation, ride history, details lookup, cancellation, and lifecycle status transitions (`driver_arrived`, `in_progress`, `completed`).
4. **`04-matching.yaml`** – **Driver Matching & Dispatch** (`FR-MATCH-01` to `FR-MATCH-06`)
   * Driver offer retrieval, atomic offer acceptance, offer decline with automated retry handling, and matching status monitoring.
5. **`05-payment.yaml`** – **Fares & Payments** (`FR-PAY-01` to `FR-PAY-07`)
   * Admin pricing configuration, fare breakdowns, secure electronic payment checkout (via tokenized third-party providers), and cash collection confirmations.
6. **`06-tracking.yaml`** – **GPS Tracking & Maps** (`FR-TRACK-01` to `FR-TRACK-04`)
   * Driver GPS telemetry ingestion, real-time ride tracking/ETA for customers, and active driver location queries for operations maps.
7. **`07-notification.yaml`** – **Notifications** (`FR-NOTIF-01` to `FR-NOTIF-05`)
   * In-app notification inbox, unread filtering, and read-state management (paired with Socket.IO realtime events).
8. **`08-rating.yaml`** – **Ratings & Reviews** (`FR-RATE-01` to `FR-RATE-03`)
   * Post-ride score and comment submissions, automated driver average updates, and public review lists without sensitive user data.
9. **`09-admin.yaml`** – **Administration & Reporting** (`FR-ADM-01` to `FR-ADM-08`)
   * Operational dashboards, customer/driver search, ride monitoring/intervention (`force_cancel`, `rematch`), payment lookups, and reporting endpoints (revenue, rides, driver performance).
10. **`10-security-audit.yaml`** – **Security, Audit & Health** (`FR-SEC-01` to `FR-SEC-05`)
    * Immutable audit log search, liveness/readiness/service health checks, and database connectivity tests.

The aggregate entry point `openapi.yaml` uses `http://localhost:3000/api/v1` and must be kept in sync with the modular YAML files. The API smoke flows include driver OTP onboarding, nearby driver search, customer booking history, signed payment callbacks, and idempotency handling.

---

## 🔒 Authentication

Most endpoints are secured using **JSON Web Tokens (JWT)**. 
To test protected endpoints in Swagger UI:
1. Call `POST /auth/login` to obtain an `accessToken`.
2. Click the **Authorize** button at the top of the Swagger UI interface.
3. Enter your token in the format: `Bearer <your_access_token>`.

---

## 🚀 How to View and Test

You can load these YAML files into any standard OpenAPI-compatible tool:
* **Swagger Editor / Swagger UI:** Import individual files or merge them into a unified OpenAPI document.
* **Postman / Insomnia:** Import the files directly as OpenAPI 3.0 collections to test mock services.
