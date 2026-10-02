const express = require('express');
const router = express.Router();
const config = require('../config');
const { createProxyHandler } = require('../controllers/proxyController');
const { authenticateJWT } = require('../middlewares/auth');

const driverProxy = createProxyHandler(config.services.driver);

// STT 21: Đăng ký tài xế (OTP & Submit Application)
router.post('/otp/request', driverProxy);
router.post('/otp/verify', driverProxy);
router.post('/register', driverProxy);

// STT 13: Nearby drivers
router.get('/nearby', authenticateJWT, driverProxy);

// STT 12: Driver details
router.get('/:id', authenticateJWT, driverProxy);

// STT 23: Update driver status
router.put('/:id/status', authenticateJWT, driverProxy);

// STT 20: Rate ride
router.post('/rides/:rideId/rating', authenticateJWT, driverProxy);

module.exports = router;
