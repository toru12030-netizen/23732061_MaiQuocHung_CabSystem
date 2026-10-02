const db = require('../config/db');

/**
 * Payment Model (Data Access Layer for PostgreSQL payment_db.payments)
 */
const PaymentModel = {
  async findById(id) {
    const res = await db.query(
      'SELECT * FROM payments WHERE id = $1 OR ride_id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  async create({ id, rideId, customerId, driverId, amount, method, transactionId }) {
    const res = await db.query(`
      INSERT INTO payments (id, ride_id, customer_id, driver_id, amount, method, status, transaction_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, NOW())
      ON CONFLICT (ride_id) DO UPDATE SET
        amount = EXCLUDED.amount,
        method = EXCLUDED.method,
        transaction_id = EXCLUDED.transaction_id
      RETURNING *
    `, [id, rideId, customerId, driverId, amount, method, transactionId]);
    return res.rows[0];
  },

  async markCompleted(paymentId, transactionId = null) {
    const res = await db.query(`
      UPDATE payments
      SET status = 'COMPLETED', paid_at = NOW(), transaction_id = COALESCE($1, transaction_id)
      WHERE id = $2 OR transaction_id = $3 OR ride_id = $4
      RETURNING *
    `, [transactionId, paymentId, paymentId, paymentId]);
    return res.rows[0] || null;
  }
};

module.exports = PaymentModel;
