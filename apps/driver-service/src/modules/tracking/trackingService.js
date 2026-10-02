const DriverModel = require('../../models/driverModel');

async function findNearbyDrivers({ lat, lng, radius = 1000, limit = 10, page = 1, status }) {
  const skip = (page - 1) * limit;
  const { drivers, total } = await DriverModel.findNearby({
    lat,
    lng,
    radiusMeters: radius,
    limit,
    skip,
    status
  });

  return {
    drivers,
    searchCenter: { lat, lng },
    radiusMeters: radius,
    page,
    limit,
    total
  };
}

module.exports = {
  findNearbyDrivers
};
