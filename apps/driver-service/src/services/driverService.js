const trackingService = require('../modules/tracking/trackingService');
const ratingService = require('../modules/rating/ratingService');
const fleetService = require('../modules/driver-fleet/driverService');

/**
 * Unified domain service for driver-service
 */
const DriverDomainService = {
  ...trackingService,
  ...ratingService,
  ...fleetService
};

module.exports = DriverDomainService;
