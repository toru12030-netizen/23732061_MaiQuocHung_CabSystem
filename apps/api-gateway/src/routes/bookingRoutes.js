const express = require('express');
const router = express.Router();
const config = require('../config');
const { createProxyHandler } = require('../controllers/proxyController');
const { authenticateJWT } = require('../middlewares/auth');
const { sensitiveRateLimiter } = require('../middlewares/rateLimiter');

const bookingProxy = createProxyHandler(config.services.booking);

// STT 14: List bookings
router.get(['/customers/:customerId/bookings', '/'], authenticateJWT, bookingProxy);

// STT 15 & STT 29: Create booking / Request ride (Rate limited)
router.post(['/', '/rides'], sensitiveRateLimiter, authenticateJWT, bookingProxy);

// STT 16: Accept ride
router.post(['/:rideId/accept', '/rides/:rideId/accept'], authenticateJWT, bookingProxy);

// STT 17: Update ride status
router.put(['/:rideId/status', '/rides/:rideId/status'], authenticateJWT, bookingProxy);

// STT 18: Cancel ride
router.post(['/:rideId/cancel', '/rides/:rideId/cancel'], authenticateJWT, bookingProxy);

module.exports = router;
