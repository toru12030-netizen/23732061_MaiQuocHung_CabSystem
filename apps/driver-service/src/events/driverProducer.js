const { Kafka } = require('kafkajs');
const { EVENT_TOPICS, createEvent } = require('@cab/event-contracts');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'cab-kafka:9092').split(',');

let producer = null;

async function getProducer() {
  if (producer) return producer;
  try {
    const kafka = new Kafka({
      clientId: 'driver-service-producer',
      brokers: KAFKA_BROKERS
    });
    producer = kafka.producer();
    await producer.connect();
    console.log('[DRIVER_KAFKA] Producer connected successfully');
    return producer;
  } catch (err) {
    console.warn('[DRIVER_KAFKA] Warning: Could not connect to Kafka broker:', err.message);
    return null;
  }
}

async function publishDriverStatusChanged(driverId, status, correlationId = null) {
  try {
    const p = await getProducer();
    if (!p) return;
    const event = createEvent('DRIVER_STATUS_CHANGED', { driverId, status }, correlationId);
    await p.send({
      topic: EVENT_TOPICS.DRIVER_OFFERED,
      messages: [{ key: driverId, value: JSON.stringify(event) }]
    });
  } catch (e) {
    console.warn('[DRIVER_KAFKA] Publish status changed failed:', e.message);
  }
}

module.exports = {
  publishDriverStatusChanged
};
