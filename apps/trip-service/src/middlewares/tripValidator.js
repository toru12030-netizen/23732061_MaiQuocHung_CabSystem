const { sendError } = require('@cab/shared-config');

function validateCreateTrip(req, res, next) {
  const { customerId, driverId, pickupAddress, dropoffAddress } = req.body;
  if (!customerId || !driverId) {
    return sendError(res, 400, 'INVALID_INPUT', 'customerId and driverId are required');
  }
  if (!pickupAddress || !dropoffAddress) {
    return sendError(res, 400, 'INVALID_INPUT', 'pickupAddress and dropoffAddress are required');
  }
  next();
}

function validateUpdateStatus(req, res, next) {
  const { status } = req.body;
  const valid = ['SCHEDULED', 'DISPATCHED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  if (!status || !valid.includes(status.toUpperCase())) {
    return sendError(res, 400, 'INVALID_STATUS', `Status must be one of: ${valid.join(', ')}`);
  }
  next();
}

function validateLocationUpdate(req, res, next) {
  const { latitude, longitude, lat, lng } = req.body;
  const finalLat = lat !== undefined ? lat : latitude;
  const finalLng = lng !== undefined ? lng : longitude;

  if (finalLat === undefined || finalLng === undefined) {
    return sendError(res, 400, 'INVALID_COORDINATES', 'latitude and longitude are required');
  }
  req.cleanedLocation = {
    lat: parseFloat(finalLat),
    lng: parseFloat(finalLng),
    speed: parseFloat(req.body.speed || 0),
    bearing: parseFloat(req.body.bearing || 0)
  };
  next();
}

module.exports = {
  validateCreateTrip,
  validateUpdateStatus,
  validateLocationUpdate
};
