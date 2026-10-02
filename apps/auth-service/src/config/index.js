try {
  require('dotenv').config();
} catch (e) {
  // Dotenv is optional in Docker containers where environment variables are injected directly
}

module.exports = {
  port: process.env.PORT || 3001,
  apiBasePath: process.env.API_BASE_PATH || '/api/v1',
  db: {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.DB_NAME || process.env.AUTH_DB_NAME || 'auth_db',
    user: process.env.DB_USER || process.env.AUTH_DB_USER || 'auth_service',
    password: process.env.DB_PASSWORD || process.env.AUTH_DB_PASSWORD || 'auth_pass_cab_2026'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_bytes_cab_system_2026',
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL_SECONDS || '900', 10), // 15 mins
    refreshTtl: parseInt(process.env.JWT_REFRESH_TTL_SECONDS || '604800', 10) // 7 days
  }
};
