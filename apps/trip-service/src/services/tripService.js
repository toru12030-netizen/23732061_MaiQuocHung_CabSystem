const TripModel = require('../models/tripModel');
const { publishTripEvent } = require('../events/tripProducer');

const TripService = {
  async createTrip(data) {
    const trip = await TripModel.createTrip(data);
    await publishTripEvent('trip.events', 'TRIP_CREATED', trip);
    return trip;
  },

  async getTripById(tripId) {
    return await TripModel.findById(tripId);
  },

  async updateTripStatus(tripId, status) {
    const updated = await TripModel.updateStatus(tripId, status);
    if (updated) {
      await publishTripEvent('trip.events', 'TRIP_STATUS_UPDATED', { tripId, status });
    }
    return updated;
  },

  async recordLocation(tripId, locationData) {
    const loc = await TripModel.recordLocation(tripId, locationData);
    await publishTripEvent('trip.events', 'TRIP_LOCATION_UPDATED', { tripId, ...locationData });
    return loc;
  },

  async getTripRoute(tripId) {
    return await TripModel.getRoute(tripId);
  },

  async getTripsByCustomer(customerId, query) {
    return await TripModel.findByCustomerId(customerId, query);
  }
};

module.exports = TripService;
