const axios = require('axios');
const RideModel = require('../../models/rideModel');
const OfferModel = require('../../models/offerModel');
const { publishRideAccepted } = require('../../events/bookingProducer');

const DRIVER_SERVICE_URL = process.env.DRIVER_SERVICE_URL || 'http://driver-service:3002';

async function dispatchRideOffer(rideId, pickupLat, pickupLng) {
  let candidateDrivers = [];
  try {
    const driverRes = await axios.get(`${DRIVER_SERVICE_URL}/drivers/nearby`, {
      params: { lat: pickupLat, lng: pickupLng, radius: 2000, limit: 3 },
      timeout: 2000
    });
    if (driverRes.data?.data?.drivers) {
      candidateDrivers = driverRes.data.data.drivers;
    }
  } catch (e) {
    console.warn('[MATCHING_DISPATCH] Could not query nearby drivers from driver-service:', e.message);
  }

  const targetDriver = candidateDrivers.length > 0 
    ? (candidateDrivers[0].driverId || candidateDrivers[0].uid) 
    : 'DRV_001';

  const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  await OfferModel.createOffer(offerId, rideId, targetDriver, 3);

  return {
    dispatchedTo: targetDriver,
    candidateCount: candidateDrivers.length || 1
  };
}

async function acceptRideAtomic(rideId, driverId) {
  const acceptedRide = await RideModel.acceptAtomic(rideId, driverId);

  if (!acceptedRide) {
    const current = await RideModel.findById(rideId);
    if (!current) {
      return { success: false, code: 'NOT_FOUND', message: `Ride not found: ${rideId}` };
    }
    return { 
      success: false, 
      code: 'RIDE_ALREADY_ACCEPTED', 
      message: `Ride cannot be accepted. Current status: ${current.status}` 
    };
  }

  await OfferModel.acceptOffer(rideId, driverId);
  publishRideAccepted(acceptedRide);

  return { success: true, ride: acceptedRide };
}

module.exports = {
  dispatchRideOffer,
  acceptRideAtomic
};
