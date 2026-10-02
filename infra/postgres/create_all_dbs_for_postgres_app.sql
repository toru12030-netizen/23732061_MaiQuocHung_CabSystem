-- ==============================================================================
-- CAB SYSTEM - FULL DATABASE CREATION SCRIPT FOR LOCAL POSTGRES APP
-- Chạy script này trên ứng dụng PostgreSQL của bạn (DBeaver / TablePlus / pgAdmin / Postgres.app)
-- ==============================================================================

-- BƯỚC 1: TẠO CÁC USER VÀ DATABASE CHO TỪNG SERVICE
-- ------------------------------------------------------------------------------

-- 1.1 Database & User cho auth-service
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'auth_service') THEN
        CREATE USER auth_service WITH ENCRYPTED PASSWORD 'auth_pass_cab_2026';
    END IF;
END
$$;

SELECT 'CREATE DATABASE auth_db OWNER auth_service'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_db')\gexec

GRANT ALL PRIVILEGES ON DATABASE auth_db TO auth_service;


-- 1.2 Database & User cho booking-service
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'booking_service') THEN
        CREATE USER booking_service WITH ENCRYPTED PASSWORD 'booking_pass_cab_2026';
    END IF;
END
$$;

SELECT 'CREATE DATABASE booking_db OWNER booking_service'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'booking_db')\gexec

GRANT ALL PRIVILEGES ON DATABASE booking_db TO booking_service;


-- 1.3 Database & User cho payment-service
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'payment_service') THEN
        CREATE USER payment_service WITH ENCRYPTED PASSWORD 'payment_pass_cab_2026';
    END IF;
END
$$;

SELECT 'CREATE DATABASE payment_db OWNER payment_service'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'payment_db')\gexec

GRANT ALL PRIVILEGES ON DATABASE payment_db TO payment_service;
