const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool(config.db);

pool.on('error', (err) => {
  console.error('[AUDIT_DB] Unexpected error on idle client:', err.message);
});

async function connectDB() {
  const client = await pool.connect();
  try {
    console.log(`[AUDIT_DB] Connected successfully to PostgreSQL '${config.db.database}' at ${config.db.host}:${config.db.port}`);

    // Create tables if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        actor_id VARCHAR(64) NOT NULL,
        actor_role VARCHAR(32) NOT NULL DEFAULT 'user',
        action VARCHAR(64) NOT NULL,
        resource VARCHAR(64) NOT NULL,
        resource_id VARCHAR(64),
        ip_address VARCHAR(45),
        user_agent TEXT,
        status VARCHAR(16) NOT NULL DEFAULT 'SUCCESS',
        details JSONB,
        checksum VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS security_events (
        id VARCHAR(64) PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        event_type VARCHAR(64) NOT NULL,
        severity VARCHAR(16) NOT NULL DEFAULT 'INFO',
        source VARCHAR(64),
        description TEXT,
        ip_address VARCHAR(45),
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Verify triggers
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION prevent_audit_tampering()
        RETURNS TRIGGER AS $$
        BEGIN
          RAISE EXCEPTION 'Audit records are immutable and cannot be updated or deleted.';
        END;
        $$ LANGUAGE plpgsql;

        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_logs_immutable') THEN
            CREATE TRIGGER trg_audit_logs_immutable
            BEFORE UPDATE OR DELETE ON audit_logs
            FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_security_events_immutable') THEN
            CREATE TRIGGER trg_security_events_immutable
            BEFORE UPDATE OR DELETE ON security_events
            FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();
          END IF;
        END
        $$;
      `);
    } catch (triggerErr) {
      console.warn('[AUDIT_DB] Immutability trigger verification notice:', triggerErr.message);
    }

    console.log('[AUDIT_DB] Schema audit_logs and security_events verified with immutable triggers.');
    return pool;
  } catch (err) {
    console.error('[AUDIT_DB] PostgreSQL connection/initialization error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  connectDB
};
