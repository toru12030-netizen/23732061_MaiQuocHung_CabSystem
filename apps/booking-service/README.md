# Booking Service

Booking & Pricing, Matching & Dispatch và Trip Execution được đóng gói trong service này cho MVP.

- `src/modules/booking-pricing`: estimate và tạo ride.
- `src/modules/matching-dispatch`: candidate, offer, timeout/retry và accept atomic.
- `src/modules/trip-execution`: trạng thái, hủy và hoàn tất chuyến.
- PostgreSQL database riêng `booking_db` lưu ride và offer.
