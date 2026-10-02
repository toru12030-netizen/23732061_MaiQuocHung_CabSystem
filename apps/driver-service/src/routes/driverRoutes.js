const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { validateNearbyQuery, validateRatingBody, validateStatusBody } = require('../middlewares/driverValidator');

// STT 21: Luồng đăng ký tài xế (OTP & Register)
router.post(['/otp/request', '/auth/driver-otp/request'], driverController.requestOtp);
router.post(['/otp/verify', '/auth/driver-otp/verify'], driverController.verifyOtp);
router.post(['/register', '/auth/register/driver'], driverController.registerDriver);

// STT 22: Danh sách tài xế (Admin & internal)
router.get(['/', '/all', '/pending'], async (req, res) => {
  try {
    const DriverModel = require('../models/driverModel');
    const status = req.query.status;
    const filter = status ? { status: status.toUpperCase() } : {};
    const drivers = await DriverModel.findAll(filter);
    return res.status(200).json({ success: true, count: drivers.length, data: drivers });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// STT 22: Duyệt hồ sơ tài xế (Admin)
router.put(['/:id/approval', '/drivers/:id/approval'], driverController.approveDriver);

// STT 13: Nearby drivers
router.get(['/nearby', '/drivers/nearby'], validateNearbyQuery, driverController.getNearby);

// STT 12: Driver details
router.get(['/:id', '/drivers/:id'], driverController.getById);

// STT 20: Rating ride
router.post(['/rides/:rideId/rating', '/:rideId/rating'], validateRatingBody, driverController.rateRide);

// STT 23: Update driver status
router.put(['/:id/status', '/drivers/:id/status'], validateStatusBody, driverController.updateStatus);

module.exports = router;
