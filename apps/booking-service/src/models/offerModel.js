const db = require('../config/db');

/**
 * Offer Model (Data Access Layer for PostgreSQL booking_db.ride_offers)
 */
const OfferModel = {
  async createOffer(id, rideId, driverId, expiresMinutes = 3) {
    const res = await db.query(`
      INSERT INTO ride_offers (id, ride_id, driver_id, status, expires_at)
      VALUES ($1, $2, $3, 'pending', NOW() + ($4 || ' minutes')::INTERVAL)
      ON CONFLICT DO NOTHING
      RETURNING *
    `, [id, rideId, driverId, expiresMinutes]);
    return res.rows[0] || null;
  },

  async acceptOffer(rideId, driverId) {
    const res = await db.query(`
      UPDATE ride_offers 
      SET status = 'accepted' 
      WHERE ride_id = $1 AND driver_id = $2
      RETURNING *
    `, [rideId, driverId]);
    return res.rows[0] || null;
  },

  async findByRideId(rideId) {
    const res = await db.query('SELECT * FROM ride_offers WHERE ride_id = $1', [rideId]);
    return res.rows;
  }
};

module.exports = OfferModel;
