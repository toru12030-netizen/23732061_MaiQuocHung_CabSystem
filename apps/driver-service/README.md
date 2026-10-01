# Driver Service

Driver & Fleet, Tracking và Rating được đóng gói trong service này cho MVP.

- `src/modules/driver-fleet`: hồ sơ, xét duyệt, phương tiện và availability.
- `src/modules/tracking`: GPS và vị trí hiện tại.
- `src/modules/rating`: review hợp lệ và rating tổng hợp.
- MongoDB `driver_db` lưu dữ liệu vận hành; Secure MongoDB giữ PII/giấy tờ.
