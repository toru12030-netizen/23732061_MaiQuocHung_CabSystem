/**
 * Module tính toán khoảng cách và giá cước chuyến đi
 */

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính trái đất (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return parseFloat((R * c).toFixed(2));
}

function estimateFareAndDuration(distanceKm, vehicleType = 'sedan') {
  const durationMin = Math.max(5, Math.round(distanceKm * 2.5));

  const baseFares = { sedan: 15000, suv: 20000, van: 30000 };
  const perKm = { sedan: 12000, suv: 15000, van: 18000 };

  const base = baseFares[vehicleType.toLowerCase()] || 15000;
  const rateKm = perKm[vehicleType.toLowerCase()] || 12000;
  const estimatedFare = Math.round(base + distanceKm * rateKm);

  return {
    distanceKm,
    durationMin,
    estimatedFare
  };
}

module.exports = {
  calculateDistance,
  estimateFareAndDuration
};
