const db = require('../config/db');

/**
 * Ride Model (Data Access Layer for PostgreSQL booking_db.rides)
 */
const RideModel = {
  async findById(id) {
    const res = await db.query('SELECT * FROM rides WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async findByCustomerId(customerId, limit = 10, offset = 0, status = null) {
    let queryText = 'SELECT * FROM rides WHERE customer_id = $1';
    let countText = 'SELECT COUNT(*) FROM rides WHERE customer_id = $1';
    const params = [customerId];

    if (status) {
      params.push(status);
      queryText += ' AND status = $2';
      countText += ' AND status = $2';
    }

    queryText += ` ORDER BY requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const queryParams = [...params, limit, offset];

    const [ridesRes, countRes] = await Promise.all([
      db.query(queryText, queryParams),
      db.query(countText, params)
    ]);

    return {
      rides: ridesRes.rows,
      total: parseInt(countRes.rows[0].count, 10)
    };
  },

  async create({
    id, customerId, vehicleType,
    pickupAddress, pickupLat, pickupLng,
    dropoffAddress, dropoffLat, dropoffLng,
    distanceKm, durationMin, estimatedFare
  }) {
    const res = await db.query(`
      INSERT INTO rides (
        id, customer_id, vehicle_type, status,
        pickup_address, pickup_lat, pickup_lng,
        dropoff_address, dropoff_lat, dropoff_lng,
        estimated_distance, estimated_duration, estimated_fare,
        requested_at
      )
      VALUES ($1, $2, $3, 'requested', $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *
    `, [
      id, customerId, vehicleType,
      pickupAddress, pickupLat, pickupLng,
      dropoffAddress, dropoffLat, dropoffLng,
      distanceKm, durationMin, estimatedFare
    ]);
    return res.rows[0];
  },

  async acceptAtomic(rideId, driverId) {
    const res = await db.query(`
      UPDATE rides 
      SET status = 'assigned', driver_id = $1, accepted_at = NOW()
      WHERE id = $2 AND status = 'requested'
      RETURNING *
    `, [driverId, rideId]);
    return res.rows[0] || null;
  },

  async updateStatus(rideId, status) {
    let updateQuery = 'UPDATE rides SET status = $1';
    const params = [status.toLowerCase(), rideId];

    if (status.toLowerCase() === 'driver_arrived') {
      updateQuery += ', arrived_at = NOW()';
    } else if (status.toLowerCase() === 'in_progress') {
      updateQuery += ', started_at = NOW()';
    } else if (status.toLowerCase() === 'completed') {
      updateQuery += ', completed_at = NOW(), actual_distance = estimated_distance, actual_duration = estimated_duration, actual_fare = estimated_fare';
    }

    updateQuery += ' WHERE id = $2 RETURNING *';
    const res = await db.query(updateQuery, params);
    return res.rows[0] || null;
  },

  async cancel(rideId, cancelReason, cancelledBy = 'customer') {
    const res = await db.query(`
      UPDATE rides 
      SET status = 'cancelled', cancel_reason = $1, cancelled_by = $2, canceled_at = NOW()
      WHERE id = $3 AND status NOT IN ('completed', 'cancelled')
      RETURNING *
    `, [cancelReason, cancelledBy, rideId]);
    return res.rows[0] || null;
  }
};

module.exports = RideModel;
