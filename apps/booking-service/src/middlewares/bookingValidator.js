const { sendError } = require('@cab/shared-config');

/**
 * Middleware kiểm tra dữ liệu đầu vào cho Booking Service
 */
function validateCreateBooking(req, res, next) {
  const { pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng } = req.body;
  if (!pickup_address || !pickup_lat || !pickup_lng || !dropoff_address || !dropoff_lat || !dropoff_lng) {
    return sendError(res, 400, 'MISSING_FIELDS', 'Pickup and dropoff addresses and coordinates are required');
  }

  const pLat = parseFloat(pickup_lat);
  const pLng = parseFloat(pickup_lng);
  const dLat = parseFloat(dropoff_lat);
  const dLng = parseFloat(dropoff_lng);

  if (isNaN(pLat) || pLat < -90 || pLat > 90 || isNaN(pLng) || pLng < -180 || pLng > 180) {
    return sendError(res, 400, 'INVALID_COORDINATES', 'Invalid pickup latitude or longitude');
  }

  if (isNaN(dLat) || dLat < -90 || dLat > 90 || isNaN(dLng) || dLng < -180 || dLng > 180) {
    return sendError(res, 400, 'INVALID_COORDINATES', 'Invalid dropoff latitude or longitude');
  }

  next();
}

function validateRideStatus(req, res, next) {
  let { status } = req.body;
  if (!status) {
    return sendError(res, 400, 'INVALID_STATUS', 'Status is required');
  }
  let normalized = status.toLowerCase();
  if (normalized === 'arrived') {
    req.body.status = 'driver_arrived';
    normalized = 'driver_arrived';
  }
  const valid = ['driver_arrived', 'in_progress', 'completed'];
  if (!valid.includes(normalized)) {
    return sendError(res, 400, 'INVALID_STATUS', `Status must be one of: ${valid.join(', ')}`);
  }
  next();
}

function validateCancelRide(req, res, next) {
  const { cancel_reason } = req.body;
  if (cancel_reason && typeof cancel_reason !== 'string') {
    return sendError(res, 400, 'INVALID_REASON', 'Cancel reason must be a string');
  }
  next();
}

module.exports = {
  validateCreateBooking,
  validateRideStatus,
  validateCancelRide
};
