-- ==============================================================================
-- DATABASE: booking_db
-- Mở database booking_db trên ứng dụng của bạn và chạy đoạn mã này:
-- ==============================================================================

-- 1. Bảng Rides (Vòng đời chuyến đi)
CREATE TABLE IF NOT EXISTS rides (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL,
  driver_id VARCHAR(64),
  vehicle_type VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'requested',
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION NOT NULL,
  dropoff_lng DOUBLE PRECISION NOT NULL,
  estimated_distance DOUBLE PRECISION NOT NULL,
  estimated_duration INT NOT NULL,
  estimated_fare INT NOT NULL,
  actual_distance DOUBLE PRECISION,
  actual_duration INT,
  actual_fare INT,
  cancel_reason TEXT,
  cancelled_by VARCHAR(20),
  retry_count INT DEFAULT 0,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_rides_customer_id ON rides(customer_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);

-- 2. Bảng Ride Offers (Lời mời chuyến gửi cho tài xế)
CREATE TABLE IF NOT EXISTS ride_offers (
  id VARCHAR(64) PRIMARY KEY,
  ride_id VARCHAR(64) NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ride_offers_lookup ON ride_offers(ride_id, driver_id, status);
