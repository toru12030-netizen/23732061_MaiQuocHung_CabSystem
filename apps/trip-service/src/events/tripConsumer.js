const { Kafka } = require('kafkajs');
const config = require('../config');
const TripModel = require('../models/tripModel');

const kafka = new Kafka({
  clientId: 'trip-service-consumer',
  brokers: config.kafkaBrokers,
  retry: { retries: 3 }
});

const consumer = kafka.consumer({ groupId: 'trip-service-group' });

async function initConsumer() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topics: ['ride.events'], fromBeginning: false });
    console.log('[TRIP_KAFKA] Consumer subscribed to ride.events');

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          console.log(`[TRIP_KAFKA] Received message on ${topic}:`, payload.eventType);

          // Tự động khởi tạo Trip khi Ride được gán tài xế
          if (payload.eventType === 'RIDE_ASSIGNED' && payload.data) {
            const ride = payload.data;
            const existing = await TripModel.findById(ride.id || ride.bookingId);
            if (!existing) {
              await TripModel.createTrip({
                bookingId: ride.id || ride.bookingId,
                customerId: ride.customerId || ride.customer_id,
                driverId: ride.driverId || ride.driver_id,
                vehicleType: ride.vehicleType || ride.vehicle_type,
                status: 'DISPATCHED',
                pickupAddress: ride.pickupAddress || ride.pickup_address,
                dropoffAddress: ride.dropoffAddress || ride.dropoff_address,
                pickupLat: ride.pickupLat || ride.pickup_lat,
                pickupLng: ride.pickupLng || ride.pickup_lng,
                dropoffLat: ride.dropoffLat || ride.dropoff_lat,
                dropoffLng: ride.dropoffLng || ride.dropoff_lng
              });
              console.log(`[TRIP_SERVICE] Auto-created Trip for Booking: ${ride.id}`);
            }
          }
        } catch (e) {
          console.error('[TRIP_KAFKA] Error processing message:', e.message);
        }
      }
    });
  } catch (err) {
    console.warn('[TRIP_KAFKA] Consumer connection warning:', err.message);
  }
}

module.exports = {
  initConsumer
};
