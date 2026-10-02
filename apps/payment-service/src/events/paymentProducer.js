const { Kafka } = require('kafkajs');
const { EVENT_TOPICS, createEvent } = require('@cab/event-contracts');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'cab-kafka:9092').split(',');

let producer = null;

async function getProducer() {
  if (producer) return producer;
  try {
    const kafka = new Kafka({
      clientId: 'payment-service-producer',
      brokers: KAFKA_BROKERS
    });
    producer = kafka.producer();
    await producer.connect();
    console.log('[PAYMENT_KAFKA] Producer connected successfully');
    return producer;
  } catch (err) {
    console.warn('[PAYMENT_KAFKA] Warning: Could not connect to Kafka broker:', err.message);
    return null;
  }
}

async function publishPaymentCompleted(payment, correlationId = null) {
  try {
    const p = await getProducer();
    if (!p) return;
    const event = createEvent('PAYMENT_COMPLETED', payment, correlationId);
    await p.send({
      topic: EVENT_TOPICS.PAYMENT_COMPLETED,
      messages: [{ key: payment.id || 'default', value: JSON.stringify(event) }]
    });
  } catch (e) {
    console.warn('[PAYMENT_KAFKA] Publish payment completed failed:', e.message);
  }
}

module.exports = {
  publishPaymentCompleted
};
