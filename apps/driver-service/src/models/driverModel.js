const { getDriversCollection } = require('../config/db');

/**
 * Driver Model (Data Access Layer for MongoDB driver_db.drivers)
 */
const DriverModel = {
  async findById(id) {
    const col = getDriversCollection();
    return col.findOne({
      $or: [{ uid: id }, { driverId: id }]
    });
  },

  async findNearby({ lat, lng, radiusMeters = 1000, limit = 10, skip = 0, status = null }) {
    const col = getDriversCollection();
    const filter = {
      'location.coordinates': {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radiusMeters
        }
      }
    };
    if (status) filter.status = status;

    const drivers = await col.find(filter).skip(skip).limit(limit).toArray();
    const total = await col.countDocuments(status ? { status } : {});
    return { drivers, total };
  },

  async updateStatus(id, status) {
    const col = getDriversCollection();
    const res = await col.findOneAndUpdate(
      { $or: [{ uid: id }, { driverId: id }] },
      { $set: { status: status.toUpperCase(), updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return res && res.value ? res.value : res;
  },

  async updateRating(driverId, newRating) {
    const col = getDriversCollection();
    return col.updateOne(
      { $or: [{ driverId }, { uid: driverId }] },
      { $set: { rating: newRating, updatedAt: new Date() } }
    );
  },

  async createPendingDriver({ phone, fullname, vehicleType = 'sedan', licensePlate, location }) {
    const col = getDriversCollection();
    const driverId = `DRV_${Date.now().toString(36).substr(4, 4).toUpperCase()}`;
    const uid = `usr_drv_${Date.now().toString(36)}`;
    const doc = {
      uid,
      driverId,
      fullname,
      phone,
      vehicleType,
      licensePlate,
      status: 'PENDING_APPROVAL',
      rating: 5.0,
      totalRides: 0,
      location: location || { type: 'Point', coordinates: [106.6868, 10.8221] },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await col.insertOne(doc);
    return doc;
  },

  async updateApproval(driverId, approvalStatus) {
    const col = getDriversCollection();
    const newStatus = approvalStatus === 'APPROVED' ? 'AVAILABLE' : 'REJECTED';
    const res = await col.findOneAndUpdate(
      { $or: [{ uid: driverId }, { driverId }] },
      { $set: { status: newStatus, approvalStatus, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return res && res.value ? res.value : res;
  },

  async findAll(filter = {}, limit = 50) {
    const col = getDriversCollection();
    return col.find(filter).limit(limit).toArray();
  }
};

module.exports = DriverModel;
