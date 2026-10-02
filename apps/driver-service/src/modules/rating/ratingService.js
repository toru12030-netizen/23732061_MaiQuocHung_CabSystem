const RatingModel = require('../../models/ratingModel');
const DriverModel = require('../../models/driverModel');

async function submitRating({ rideId, customerId, driverId = 'DRV_001', stars, comment }) {
  const ratingDoc = await RatingModel.upsertRating({
    rideId,
    customerId,
    driverId,
    stars,
    comment
  });

  if (driverId) {
    const avg = await RatingModel.calculateAverageRating(driverId);
    await DriverModel.updateRating(driverId, avg);
  }

  return ratingDoc;
}

module.exports = {
  submitRating
};
