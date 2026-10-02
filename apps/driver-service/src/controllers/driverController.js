const trackingService = require('../modules/tracking/trackingService');
const ratingService = require('../modules/rating/ratingService');
const fleetService = require('../modules/driver-fleet/driverService');
const { sendError } = require('@cab/shared-config');

const driverController = {
  // STT 13: Nearby drivers
  async getNearby(req, res) {
    try {
      const lat = parseFloat(req.query.lat || 10.8221);
      const lng = parseFloat(req.query.lng || 106.6868);
      const radius = parseInt(req.query.radius, 10) || 1000;
      const limit = parseInt(req.query.limit, 10) || 10;
      const page = parseInt(req.query.page, 10) || 1;
      const status = req.query.status;

      const result = await trackingService.findNearbyDrivers({ lat, lng, radius, limit, page, status });
      return res.status(200).json({
        success: true,
        message: 'Nearby drivers retrieved successfully',
        data: result
      });
    } catch (err) {
      console.error('[DRIVER_CONTROLLER] getNearby error:', err);
      return sendError(res, 500, 'SEARCH_FAILED', err.message);
    }
  },

  // STT 12: Get driver by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const driver = await fleetService.getDriverById(id);

      if (!driver) {
        return sendError(res, 404, 'NOT_FOUND', `Driver not found with identifier: ${id}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Driver information retrieved successfully',
        data: driver
      });
    } catch (err) {
      console.error('[DRIVER_CONTROLLER] getById error:', err);
      return sendError(res, 500, 'RETRIEVE_FAILED', err.message);
    }
  },

  // STT 20: Rating ride
  async rateRide(req, res) {
    try {
      const { rideId } = req.params;
      const stars = req.body.stars || req.body.rating;
      const comment = req.body.comment;
      const driverId = req.body.driverId || req.body.driver_id || 'DRV_001';
      const customerId = req.headers['x-user-id'] || req.body.customerId || req.body.customer_id || 'anonymous';

      if (!stars || stars < 1 || stars > 5) {
        return sendError(res, 400, 'INVALID_RATING', 'Stars must be an integer between 1 and 5');
      }

      const ratingDoc = await ratingService.submitRating({ rideId, customerId, driverId, stars, comment });
      return res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: ratingDoc
      });
    } catch (err) {
      console.error('[DRIVER_CONTROLLER] rateRide error:', err);
      return sendError(res, 500, 'RATING_FAILED', err.message);
    }
  },

  // STT 23: Update driver status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['AVAILABLE', 'BUSY', 'OFFLINE', 'ON_TRIP'];
      if (!status || !validStatuses.includes(status.toUpperCase())) {
        return sendError(res, 400, 'INVALID_STATUS', `Status must be one of: ${validStatuses.join(', ')}`);
      }

      const updated = await fleetService.updateDriverStatus(id, status);
      if (!updated) {
        return sendError(res, 404, 'NOT_FOUND', `Driver not found with identifier: ${id}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Driver status updated successfully',
        data: updated
      });
    } catch (err) {
      console.error('[DRIVER_CONTROLLER] updateStatus error:', err);
      return sendError(res, 500, 'UPDATE_FAILED', err.message);
    }
  },

  // STT 21: Yêu cầu gửi mã OTP
  async requestOtp(req, res) {
    try {
      const { phone } = req.body;
      if (!phone) return sendError(res, 400, 'MISSING_PHONE', 'Phone number is required');
      const result = await fleetService.requestOtp(phone);
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: result
      });
    } catch (err) {
      return sendError(res, 500, 'OTP_ERROR', err.message);
    }
  },

  // STT 21: Xác thực OTP
  async verifyOtp(req, res) {
    try {
      const { phone, otp } = req.body;
      if (!phone || !otp) return sendError(res, 400, 'MISSING_FIELDS', 'Phone and OTP are required');
      const result = await fleetService.verifyOtp(phone, otp);
      if (!result.verified) {
        return sendError(res, 400, 'INVALID_OTP', result.message);
      }
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: { phone, verified: true }
      });
    } catch (err) {
      return sendError(res, 500, 'VERIFY_ERROR', err.message);
    }
  },

  // STT 21: Nộp hồ sơ tài xế (Tạo tài xế ở trạng thái PENDING_APPROVAL)
  async registerDriver(req, res) {
    try {
      const phone = req.body.phone;
      const fullname = req.body.fullname || req.body.full_name || req.body.name;
      const vehicleType = req.body.vehicleType || req.body.vehicle_type || 'CAR_4_SEATS';
      const licensePlate = req.body.licensePlate || req.body.license_plate || req.body.vehicle_plate || '51H-999.99';

      if (!phone || !fullname) {
        return sendError(res, 400, 'MISSING_FIELDS', 'Phone and fullname are required');
      }
      const driver = await fleetService.registerDriver({
        ...req.body,
        phone,
        fullname,
        vehicleType,
        licensePlate
      });
      return res.status(201).json({
        success: true,
        message: 'Driver application submitted successfully. Pending approval.',
        data: {
          driver,
          id: driver.driverId || driver.uid,
          driverId: driver.driverId || driver.uid,
          status: driver.status
        }
      });
    } catch (err) {
      return sendError(res, 500, 'REGISTER_ERROR', err.message);
    }
  },

  // STT 22: Duyệt hồ sơ tài xế (Admin)
  async approveDriver(req, res) {
    try {
      const { id } = req.params;
      const { status = 'APPROVED' } = req.body;
      const approved = await fleetService.approveDriver(id, status);
      if (!approved) {
        return sendError(res, 404, 'NOT_FOUND', `Driver not found with identifier: ${id}`);
      }
      return res.status(200).json({
        success: true,
        message: `Driver application ${status.toLowerCase()} successfully`,
        data: approved
      });
    } catch (err) {
      return sendError(res, 500, 'APPROVAL_ERROR', err.message);
    }
  }
};

module.exports = driverController;
