const { calculateDistance, estimateFareAndDuration } = require('../modules/booking-pricing/pricingCalculator');
const { dispatchRideOffer, acceptRideAtomic } = require('../modules/matching-dispatch/dispatchService');
const tripService = require('../modules/trip-execution/tripService');
const { sendError } = require('@cab/shared-config');

const bookingController = {
  // STT 14: Lấy danh sách booking của customer
  async listBookings(req, res) {
    try {
      const customerId = req.params.customerId || req.query.customer_id || req.headers['x-user-id'] || 'usr_cust_001';
      const limit = parseInt(req.query.limit, 10) || 10;
      const page = parseInt(req.query.page, 10) || 1;
      const status = req.query.status;

      const data = await tripService.listCustomerBookings(customerId, limit, page, status);
      return res.status(200).json({
        success: true,
        message: 'Customer bookings retrieved successfully',
        data
      });
    } catch (err) {
      console.error('[BOOKING_CONTROLLER] listBookings error:', err);
      return sendError(res, 500, 'RETRIEVE_FAILED', err.message);
    }
  },

  // STT 15: Đặt xe
  async createBooking(req, res) {
    try {
      const {
        customer_id,
        pickup_address,
        pickup_lat,
        pickup_lng,
        dropoff_address,
        dropoff_lat,
        dropoff_lng,
        vehicle_type = 'sedan'
      } = req.body;

      const custId = customer_id || req.headers['x-user-id'] || 'usr_cust_001';

      if (!pickup_address || !pickup_lat || !pickup_lng || !dropoff_address || !dropoff_lat || !dropoff_lng) {
        return sendError(res, 400, 'MISSING_FIELDS', 'Pickup and dropoff addresses and coordinates are required');
      }

      const distanceKm = calculateDistance(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng);
      const { durationMin, estimatedFare } = estimateFareAndDuration(distanceKm, vehicle_type);
      const rideId = `ride_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const createdRide = await tripService.createRideRecord({
        rideId,
        customerId: custId,
        vehicleType: vehicle_type,
        pickupAddress: pickup_address,
        pickupLat: pickup_lat,
        pickupLng: pickup_lng,
        dropoffAddress: dropoff_address,
        dropoffLat: dropoff_lat,
        dropoffLng: dropoff_lng,
        distanceKm,
        durationMin,
        estimatedFare
      });

      // Dispatch offer
      const dispatchInfo = await dispatchRideOffer(rideId, pickup_lat, pickup_lng);

      return res.status(201).json({
        success: true,
        message: 'Booking created successfully. Finding nearby drivers...',
        data: {
          booking: createdRide,
          status: 'requested',
          estimatedFare,
          estimatedDistance: distanceKm,
          estimatedDuration: durationMin,
          candidateDriverCount: dispatchInfo.candidateCount,
          dispatchedOfferTo: dispatchInfo.dispatchedTo
        }
      });
    } catch (err) {
      console.error('[BOOKING_CONTROLLER] createBooking error:', err);
      return sendError(res, 500, 'CREATE_BOOKING_FAILED', err.message);
    }
  },

  // STT 16: Tài xế nhận chuyến
  async acceptRide(req, res) {
    try {
      const { rideId } = req.params;
      const driverId = req.body.driver_id || req.headers['x-user-id'] || 'DRV_001';

      const result = await acceptRideAtomic(rideId, driverId);
      if (!result.success) {
        const statusCode = result.code === 'NOT_FOUND' ? 404 : 409;
        return sendError(res, statusCode, result.code, result.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Ride accepted successfully by driver',
        data: result.ride
      });
    } catch (err) {
      console.error('[BOOKING_CONTROLLER] acceptRide error:', err);
      return sendError(res, 500, 'ACCEPT_FAILED', err.message);
    }
  },

  // STT 17: Cập nhật trạng thái
  async updateStatus(req, res) {
    try {
      const { rideId } = req.params;
      const { status } = req.body;

      let normalizedStatus = (status || '').toLowerCase();
      if (normalizedStatus === 'arrived') normalizedStatus = 'driver_arrived';

      const validStatuses = ['driver_arrived', 'in_progress', 'completed'];
      if (!status || !validStatuses.includes(normalizedStatus)) {
        return sendError(res, 400, 'INVALID_STATUS', `Status must be one of: ${validStatuses.join(', ')}`);
      }

      const result = await tripService.updateRideStatus(rideId, normalizedStatus);
      if (!result.success) {
        return sendError(res, 404, result.code, result.message);
      }

      return res.status(200).json({
        success: true,
        message: `Ride status updated to '${normalizedStatus}'`,
        data: result.ride
      });
    } catch (err) {
      console.error('[BOOKING_CONTROLLER] updateStatus error:', err);
      return sendError(res, 500, 'UPDATE_STATUS_FAILED', err.message);
    }
  },

  // STT 18: Hủy chuyến
  async cancelRide(req, res) {
    try {
      const { rideId } = req.params;
      const cancelReason = req.body.cancel_reason || req.body.reason || 'Khách hàng đổi ý';
      const cancelledBy = req.body.cancelled_by || 'customer';

      const result = await tripService.cancelRide(rideId, cancelReason, cancelledBy);
      if (!result.success) {
        return sendError(res, 400, result.code, result.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Ride cancelled successfully',
        data: result.ride
      });
    } catch (err) {
      console.error('[BOOKING_CONTROLLER] cancelRide error:', err);
      return sendError(res, 500, 'CANCEL_ERROR', err.message);
    }
  }
};

module.exports = bookingController;
