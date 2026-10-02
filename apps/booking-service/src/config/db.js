const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'host.docker.internal',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'booking_db',
  user: process.env.DB_USER || 'booking_service',
  password: process.env.DB_PASSWORD || 'booking_pass_cab_2026',
  max: 10,
  idleTimeoutMillis: 30000
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
