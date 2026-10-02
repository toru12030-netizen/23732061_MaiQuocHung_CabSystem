const { Kafka } = require('kafkajs');
const { createEvent } = require('@cab/event-contracts');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'cab-kafka:9092').split(',');
let producer = null;

async function getProducer() {
  if (producer) return producer;
  try {
    const kafka = new Kafka({
      clientId: 'auth-service-producer',
      brokers: KAFKA_BROKERS
    });
    producer = kafka.producer();
    await producer.connect();
    return producer;
  } catch (err) {
    return null;
  }
}

async function publishUserRegistered(user, correlationId = null) {
  try {
    const p = await getProducer();
    if (!p) return;
    const event = createEvent('USER_REGISTERED', user, correlationId);
    await p.send({
      topic: 'cab.user.events',
      messages: [{ key: user.uid, value: JSON.stringify(event) }]
    });
  } catch (e) {
    // Non-blocking
  }
}

module.exports = {
  publishUserRegistered
};
