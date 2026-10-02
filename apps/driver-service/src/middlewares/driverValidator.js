const { sendError } = require('@cab/shared-config');

/**
 * Middleware xác thực dữ liệu đầu vào cho Driver Service
 */
function validateNearbyQuery(req, res, next) {
  const { lat, lng } = req.query;
  if (lat && (isNaN(parseFloat(lat)) || parseFloat(lat) < -90 || parseFloat(lat) > 90)) {
    return sendError(res, 400, 'INVALID_COORDINATES', 'Latitude must be a valid float between -90 and 90');
  }
  if (lng && (isNaN(parseFloat(lng)) || parseFloat(lng) < -180 || parseFloat(lng) > 180)) {
    return sendError(res, 400, 'INVALID_COORDINATES', 'Longitude must be a valid float between -180 and 180');
  }
  next();
}

function validateRatingBody(req, res, next) {
  const stars = req.body.stars || req.body.rating;
  req.body.stars = stars;
  const numStars = parseInt(stars, 10);
  if (!stars || isNaN(numStars) || numStars < 1 || numStars > 5) {
    return sendError(res, 400, 'INVALID_RATING', 'Stars must be an integer between 1 and 5');
  }
  next();
}

function validateStatusBody(req, res, next) {
  const { status } = req.body;
  const valid = ['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_TRIP'];
  if (!status || !valid.includes(status.toUpperCase())) {
    return sendError(res, 400, 'INVALID_STATUS', `Status must be one of: ${valid.join(', ')}`);
  }
  next();
}

module.exports = {
  validateNearbyQuery,
  validateRatingBody,
  validateStatusBody
};
