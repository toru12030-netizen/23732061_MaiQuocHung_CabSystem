const { Kafka } = require('kafkajs');
const { EVENT_TOPICS, createEvent } = require('@cab/event-contracts');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'cab-kafka:9092').split(',');

let producer = null;

async function getProducer() {
  if (producer) return producer;
  try {
    const kafka = new Kafka({
      clientId: 'booking-service-producer',
      brokers: KAFKA_BROKERS
    });
    producer = kafka.producer();
    await producer.connect();
    console.log('[BOOKING_KAFKA] Producer connected successfully');
    return producer;
  } catch (err) {
    console.warn('[BOOKING_KAFKA] Warning: Could not connect to Kafka broker:', err.message);
    return null;
  }
}

async function publishBookingEvent(eventType, topic, payload, correlationId = null) {
  try {
    const p = await getProducer();
    if (!p) return;
    const event = createEvent(eventType, payload, correlationId);
    await p.send({
      topic,
      messages: [{ key: payload.rideId || payload.id || 'default', value: JSON.stringify(event) }]
    });
  } catch (e) {
    console.warn(`[BOOKING_KAFKA] Publish ${eventType} failed:`, e.message);
  }
}

module.exports = {
  publishRideRequested: (ride, corr) => publishBookingEvent('RIDE_REQUESTED', EVENT_TOPICS.RIDE_REQUESTED, ride, corr),
  publishRideAccepted: (ride, corr) => publishBookingEvent('RIDE_ACCEPTED', EVENT_TOPICS.RIDE_ACCEPTED, ride, corr),
  publishRideCompleted: (ride, corr) => publishBookingEvent('RIDE_COMPLETED', EVENT_TOPICS.RIDE_COMPLETED, ride, corr),
  publishRideCanceled: (ride, corr) => publishBookingEvent('RIDE_CANCELED', EVENT_TOPICS.RIDE_CANCELED, ride, corr)
};
