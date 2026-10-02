/**
 * Trip Service Environment Configuration
 * File tên là env.js để phân biệt rõ ràng với src/index.js của server
 */

try {
  require('dotenv').config();
} catch (e) {
  // Dotenv is optional in Docker containers where environment variables are injected directly
}

module.exports = {
  port: parseInt(process.env.PORT || '3008', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://host.docker.internal:27017/trip_db',
  dbName: process.env.DB_NAME || 'trip_db',
  kafkaBrokers: (process.env.KAFKA_BROKERS || 'cab-kafka:9092').split(',')
};
