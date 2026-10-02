const { Kafka } = require('kafkajs');
const config = require('../config');

const kafka = new Kafka({
  clientId: 'trip-service-producer',
  brokers: config.kafkaBrokers,
  retry: { retries: 3 }
});

const producer = kafka.producer();
let isConnected = false;

async function initProducer() {
  try {
    await producer.connect();
    isConnected = true;
    console.log('[TRIP_KAFKA] Producer connected to Kafka brokers');
  } catch (err) {
    console.warn('[TRIP_KAFKA] Producer connection warning:', err.message);
  }
}

async function publishTripEvent(topic, eventType, data) {
  if (!isConnected) {
    console.log(`[TRIP_KAFKA_MOCK] Broker unavailable, logged event ${eventType}:`, data?.tripId);
    return;
  }
  try {
    await producer.send({
      topic,
      messages: [{
        key: data.tripId || data.bookingId || 'trip_key',
        value: JSON.stringify({
          eventType,
          timestamp: new Date().toISOString(),
          data
        })
      }]
    });
  } catch (err) {
    console.error(`[TRIP_KAFKA] Failed to publish ${eventType}:`, err.message);
  }
}

module.exports = {
  initProducer,
  publishTripEvent
};
