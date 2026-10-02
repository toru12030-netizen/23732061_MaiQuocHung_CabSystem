const { Pool } = require('pg');
const config = require('./index');

const pool = new Pool(config.db);

pool.on('error', (err) => {
  console.error('[AUTH_DB] Unexpected error on idle client:', err.message);
});

async function initDb() {
  const client = await pool.connect();
  try {
    console.log(`[AUTH_DB] Connected to PostgreSQL '${config.db.database}' at ${config.db.host}:${config.db.port}`);
    
    // 1. Tạo bảng users: User(uid, username, password, role)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        uid VARCHAR(64) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'member',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tạo bảng token_blacklist phục vụ tính năng logout
    await client.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL,
        uid VARCHAR(64),
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[AUTH_DB] Schema User(uid, username, password, role) initialized.');
  } catch (error) {
    console.error('[AUTH_DB] Initialization error:', error.message);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDb
};
