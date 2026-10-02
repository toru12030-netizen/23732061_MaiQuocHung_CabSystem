const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { validateCreateBooking, validateRideStatus, validateCancelRide } = require('../middlewares/bookingValidator');

// STT 14: List customer bookings
router.get(['/customers/:customerId/bookings', '/bookings'], bookingController.listBookings);

// STT 15: Create booking / Ride request (với validation)
router.post(['/bookings', '/rides'], validateCreateBooking, bookingController.createBooking);

// STT 16: Accept ride
router.post(['/rides/:rideId/accept', '/:rideId/accept'], bookingController.acceptRide);

// STT 17: Update ride status (với validation)
router.put(['/rides/:rideId/status', '/:rideId/status'], validateRideStatus, bookingController.updateStatus);

// STT 18: Cancel ride (với validation)
router.post(['/rides/:rideId/cancel', '/:rideId/cancel'], validateCancelRide, bookingController.cancelRide);

module.exports = router;
