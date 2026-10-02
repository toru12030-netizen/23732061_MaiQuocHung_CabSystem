const RideModel = require('../../models/rideModel');
const { publishRideRequested, publishRideCompleted, publishRideCanceled } = require('../../events/bookingProducer');

async function listCustomerBookings(customerId, limit = 10, page = 1, status = null) {
  const offset = (page - 1) * limit;
  const { rides, total } = await RideModel.findByCustomerId(customerId, limit, offset, status);
  return {
    bookings: rides,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

async function createRideRecord({
  rideId, customerId, vehicleType,
  pickupAddress, pickupLat, pickupLng,
  dropoffAddress, dropoffLat, dropoffLng,
  distanceKm, durationMin, estimatedFare
}) {
  const created = await RideModel.create({
    id: rideId,
    customerId,
    vehicleType,
    pickupAddress,
    pickupLat,
    pickupLng,
    dropoffAddress,
    dropoffLat,
    dropoffLng,
    distanceKm,
    durationMin,
    estimatedFare
  });

  // Gửi sự kiện tạo cuốc xe lên Kafka
  publishRideRequested(created);
  return created;
}

async function updateRideStatus(rideId, status) {
  const updated = await RideModel.updateStatus(rideId, status);
  if (!updated) {
    return { success: false, code: 'NOT_FOUND', message: `Ride not found: ${rideId}` };
  }

  if (status.toLowerCase() === 'completed') {
    publishRideCompleted(updated);
  }

  return { success: true, ride: updated };
}

async function cancelRide(rideId, cancelReason, cancelledBy = 'customer') {
  const canceled = await RideModel.cancel(rideId, cancelReason, cancelledBy);
  if (!canceled) {
    return { success: false, code: 'CANCEL_FAILED', message: `Ride ${rideId} not found or is already completed/cancelled` };
  }

  publishRideCanceled(canceled);
  return { success: true, ride: canceled };
}

module.exports = {
  listCustomerBookings,
  createRideRecord,
  updateRideStatus,
  cancelRide
};
