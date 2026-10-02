const db = require('../config/db');

/**
 * Idempotency Model (Data Access Layer for PostgreSQL payment_db.idempotency_records)
 */
const IdempotencyModel = {
  async findByKey(key) {
    const res = await db.query(
      'SELECT response_payload, status_code FROM idempotency_records WHERE idempotency_key = $1',
      [key]
    );
    return res.rows[0] || null;
  },

  async saveRecord({ key, userId, requestHash, responsePayload, statusCode = 201 }) {
    const res = await db.query(`
      INSERT INTO idempotency_records (idempotency_key, user_id, request_hash, response_payload, status_code)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING *
    `, [key, userId, requestHash, responsePayload, statusCode]);
    return res.rows[0] || null;
  }
};

module.exports = IdempotencyModel;
