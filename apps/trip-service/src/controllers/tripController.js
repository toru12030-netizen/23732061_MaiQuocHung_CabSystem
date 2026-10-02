const TripService = require('../services/tripService');
const { sendSuccess, sendError } = require('@cab/shared-config');

const TripController = {
  async createTrip(req, res) {
    try {
      const trip = await TripService.createTrip(req.body);
      return sendSuccess(res, trip, 201, 'Trip created successfully');
    } catch (err) {
      return sendError(res, 500, 'CREATE_TRIP_FAILED', err.message);
    }
  },

  async getTripById(req, res) {
    try {
      const { id } = req.params;
      const trip = await TripService.getTripById(id);
      if (!trip) {
        return sendError(res, 404, 'TRIP_NOT_FOUND', `Trip not found: ${id}`);
      }
      return sendSuccess(res, trip, 200, 'Trip details retrieved');
    } catch (err) {
      return sendError(res, 500, 'GET_TRIP_FAILED', err.message);
    }
  },

  async updateTripStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await TripService.updateTripStatus(id, status);
      if (!updated) {
        return sendError(res, 404, 'TRIP_NOT_FOUND', `Trip not found: ${id}`);
      }
      return sendSuccess(res, updated, 200, `Trip status updated to ${status}`);
    } catch (err) {
      return sendError(res, 500, 'UPDATE_STATUS_FAILED', err.message);
    }
  },

  async recordLocation(req, res) {
    try {
      const { id } = req.params;
      const loc = await TripService.recordLocation(id, req.cleanedLocation);
      return sendSuccess(res, loc, 200, 'Trip location updated successfully');
    } catch (err) {
      return sendError(res, 500, 'LOCATION_UPDATE_FAILED', err.message);
    }
  },

  async getTripLocation(req, res) {
    try {
      const { id } = req.params;
      const trip = await TripService.getTripById(id);
      if (!trip) {
        return sendError(res, 404, 'TRIP_NOT_FOUND', `Trip not found: ${id}`);
      }
      return sendSuccess(res, {
        tripId: trip.tripId,
        currentLocation: trip.currentLocation,
        status: trip.status,
        driverId: trip.driverId,
        etaMinutes: Math.max(1, Math.round(trip.estimatedDuration || 10))
      }, 200, 'Latest trip location and ETA');
    } catch (err) {
      return sendError(res, 500, 'GET_LOCATION_FAILED', err.message);
    }
  },

  async getTripRoute(req, res) {
    try {
      const { id } = req.params;
      const route = await TripService.getTripRoute(id);
      return sendSuccess(res, { tripId: id, totalWaypoints: route.length, route }, 200, 'Trip route history');
    } catch (err) {
      return sendError(res, 500, 'GET_ROUTE_FAILED', err.message);
    }
  },

  async getTripsByCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const trips = await TripService.getTripsByCustomer(customerId, req.query);
      return sendSuccess(res, { customerId, count: trips.length, trips }, 200, 'Customer trips retrieved');
    } catch (err) {
      return sendError(res, 500, 'GET_CUSTOMER_TRIPS_FAILED', err.message);
    }
  }
};

module.exports = TripController;
