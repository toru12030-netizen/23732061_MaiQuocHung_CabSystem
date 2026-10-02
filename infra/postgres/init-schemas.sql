-- ==============================================================================
-- 1. AUTH_DB SCHEMA
-- ==============================================================================
\connect auth_db auth_service

CREATE TABLE IF NOT EXISTS users (
  uid VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE TABLE IF NOT EXISTS token_blacklist (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL,
  uid VARCHAR(64),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON token_blacklist(token);

-- ==============================================================================
-- 2. BOOKING_DB SCHEMA
-- ==============================================================================
\connect booking_db booking_service

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

CREATE TABLE IF NOT EXISTS ride_offers (
  id VARCHAR(64) PRIMARY KEY,
  ride_id VARCHAR(64) NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ride_offers_lookup ON ride_offers(ride_id, driver_id, status);

-- ==============================================================================
-- 3. PAYMENT_DB SCHEMA
-- ==============================================================================
\connect payment_db payment_service

CREATE TABLE IF NOT EXISTS pricing_configs (
  id SERIAL PRIMARY KEY,
  vehicle_type VARCHAR(20) UNIQUE NOT NULL,
  base_fare INT NOT NULL,
  price_per_km INT NOT NULL,
  price_per_min INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO pricing_configs (vehicle_type, base_fare, price_per_km, price_per_min)
VALUES 
  ('sedan', 15000, 12000, 1000),
  ('suv', 20000, 15000, 1200),
  ('van', 30000, 18000, 1500)
ON CONFLICT (vehicle_type) DO NOTHING;

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

CREATE TABLE IF NOT EXISTS idempotency_records (
  idempotency_key VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  response_payload JSONB NOT NULL,
  status_code INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
