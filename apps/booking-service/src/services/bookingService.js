const pricingCalculator = require('../modules/booking-pricing/pricingCalculator');
const dispatchService = require('../modules/matching-dispatch/dispatchService');
const tripService = require('../modules/trip-execution/tripService');

/**
 * High-level domain service orchestrating the booking lifecycle
 */
const BookingService = {
  ...pricingCalculator,
  ...dispatchService,
  ...tripService
};

module.exports = BookingService;
