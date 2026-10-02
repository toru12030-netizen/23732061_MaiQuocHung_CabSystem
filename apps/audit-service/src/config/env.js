/**
 * Audit Service Environment Configuration (PostgreSQL backed)
 * File tên là env.js để phân biệt rõ ràng với src/index.js của server
 */

try {
  require('dotenv').config();
} catch (e) {
  // Dotenv is optional in Docker containers where environment variables are injected directly
}

module.exports = {
  port: parseInt(process.env.PORT || '3009', 10),
  db: {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.DB_NAME || 'audit_db',
    user: process.env.DB_USER || 'audit_service',
    password: process.env.DB_PASSWORD || 'audit_pass_cab_2026'
  },
  kafkaBrokers: (process.env.KAFKA_BROKERS || 'cab-kafka:9092').split(',')
};
