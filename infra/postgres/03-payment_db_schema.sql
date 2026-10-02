-- ==============================================================================
-- DATABASE: payment_db
-- Mở database payment_db trên ứng dụng của bạn và chạy đoạn mã này:
-- ==============================================================================

-- 1. Bảng Pricing Configs (Cấu hình bảng giá)
CREATE TABLE IF NOT EXISTS pricing_configs (
  id SERIAL PRIMARY KEY,
  vehicle_type VARCHAR(20) UNIQUE NOT NULL,
  base_fare INT NOT NULL,
  price_per_km INT NOT NULL,
  price_per_min INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Khởi tạo sẵn giá cho 3 loại xe
INSERT INTO pricing_configs (vehicle_type, base_fare, price_per_km, price_per_min)
VALUES 
  ('sedan', 15000, 12000, 1000),
  ('suv', 20000, 15000, 1200),
  ('van', 30000, 18000, 1500)
ON CONFLICT (vehicle_type) DO NOTHING;

-- 2. Bảng Payments (Thanh toán chuyến đi)
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  ride_id VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64) NOT NULL,
  driver_id VARCHAR(64) NOT NULL,
  amount INT NOT NULL,
  method VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  transaction_id VARCHAR(100),
  failure_reason TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_ride_id ON payments(ride_id);

-- 3. Bảng Idempotency Records (Chống Replay Attack - Tiêu chí 30)
CREATE TABLE IF NOT EXISTS idempotency_records (
  idempotency_key VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  response_payload JSONB NOT NULL,
  status_code INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
