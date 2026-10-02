const { getTripsCollection, getTripLocationsCollection } = require('../config/db');

const TripModel = {
  async createTrip(data) {
    const col = getTripsCollection();
    const doc = {
      tripId: data.tripId || `trip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      bookingId: data.bookingId,
      customerId: data.customerId,
      driverId: data.driverId,
      vehicleType: data.vehicleType || 'CAR_4_SEATS',
      status: data.status || 'SCHEDULED', // SCHEDULED, DISPATCHED, ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED
      pickupAddress: data.pickupAddress,
      pickupLocation: {
        type: 'Point',
        coordinates: [data.pickupLng || 106.6868, data.pickupLat || 10.8221]
      },
      dropoffAddress: data.dropoffAddress,
      dropoffLocation: {
        type: 'Point',
        coordinates: [data.dropoffLng || 106.6588, data.dropoffLat || 10.8184]
      },
      currentLocation: {
        lat: data.pickupLat || 10.8221,
        lng: data.pickupLng || 106.6868
      },
      estimatedDistance: data.estimatedDistance || 5.0,
      estimatedDuration: data.estimatedDuration || 15,
      actualDistance: data.actualDistance || 0,
      actualDuration: data.actualDuration || 0,
      startedAt: null,
      arrivedAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await col.insertOne(doc);
    return doc;
  },

  async findById(tripId) {
    const col = getTripsCollection();
    return await col.findOne({ $or: [{ tripId }, { bookingId: tripId }] });
  },

  async updateStatus(tripId, status, extraFields = {}) {
    const col = getTripsCollection();
    const updateObj = {
      status: status.toUpperCase(),
      updatedAt: new Date(),
      ...extraFields
    };
    if (status.toUpperCase() === 'ARRIVED') updateObj.arrivedAt = new Date();
    if (status.toUpperCase() === 'IN_PROGRESS') updateObj.startedAt = new Date();
    if (status.toUpperCase() === 'COMPLETED') updateObj.completedAt = new Date();

    const res = await col.findOneAndUpdate(
      { $or: [{ tripId }, { bookingId: tripId }] },
      { $set: updateObj },
      { returnDocument: 'after' }
    );
    return res;
  },

  async recordLocation(tripId, { lat, lng, speed = 0, bearing = 0 }) {
    const tripsCol = getTripsCollection();
    const locCol = getTripLocationsCollection();

    // 1. Log point to history
    const locDoc = {
      tripId,
      location: { type: 'Point', coordinates: [lng, lat] },
      lat,
      lng,
      speed,
      bearing,
      recordedAt: new Date()
    };
    await locCol.insertOne(locDoc);

    // 2. Update current location in trip
    await tripsCol.updateOne(
      { $or: [{ tripId }, { bookingId: tripId }] },
      {
        $set: {
          currentLocation: { lat, lng, speed, bearing },
          updatedAt: new Date()
        }
      }
    );

    return locDoc;
  },

  async getRoute(tripId) {
    const locCol = getTripLocationsCollection();
    return await locCol.find({ tripId }).sort({ recordedAt: 1 }).toArray();
  },

  async findByCustomerId(customerId, { limit = 20, page = 1 } = {}) {
    const col = getTripsCollection();
    const skip = (page - 1) * limit;
    return await col.find({ customerId }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
  }
};

module.exports = TripModel;
