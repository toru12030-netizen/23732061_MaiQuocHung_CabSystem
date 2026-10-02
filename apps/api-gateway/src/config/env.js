/**
 * API Gateway Environment & Service Endpoints Configuration
 * File đổi tên thành env.js để phân biệt rõ ràng với src/index.js của server
 */

try {
  require('dotenv').config();
} catch (e) {
  // Dotenv is optional in Docker containers where environment variables are injected directly
}

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  apiBasePath: process.env.API_BASE_PATH || '/api/v1',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_bytes_cab_system_2026',
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    driver: process.env.DRIVER_SERVICE_URL || 'http://driver-service:3002',
    booking: process.env.BOOKING_SERVICE_URL || 'http://booking-service:3003',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005',
    admin: process.env.ADMIN_SERVICE_URL || 'http://admin-service:3006',
    trip: process.env.TRIP_SERVICE_URL || 'http://trip-service:3008',
    audit: process.env.AUDIT_SERVICE_URL || 'http://audit-service:3009'
  }
};
