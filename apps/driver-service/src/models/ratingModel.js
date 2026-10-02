const { getRatingsCollection } = require('../config/db');

/**
 * Rating Model (Data Access Layer for MongoDB driver_db.ratings)
 */
const RatingModel = {
  async upsertRating({ rideId, customerId, driverId, stars, comment }) {
    const col = getRatingsCollection();
    const doc = {
      rideId,
      customerId,
      driverId,
      stars: parseInt(stars, 10),
      comment: comment || '',
      createdAt: new Date()
    };
    await col.updateOne({ rideId }, { $set: doc }, { upsert: true });
    return doc;
  },

  async findByDriverId(driverId) {
    const col = getRatingsCollection();
    return col.find({ driverId }).toArray();
  },

  async calculateAverageRating(driverId) {
    const ratings = await this.findByDriverId(driverId);
    if (!ratings || ratings.length === 0) return 5.0;
    const sum = ratings.reduce((acc, r) => acc + r.stars, 0);
    return parseFloat((sum / ratings.length).toFixed(1));
  }
};

module.exports = RatingModel;
