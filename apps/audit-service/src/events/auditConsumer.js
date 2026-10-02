const { Kafka } = require('kafkajs');
const config = require('../config');
const AuditModel = require('../models/auditModel');

const kafka = new Kafka({
  clientId: 'audit-service-consumer',
  brokers: config.kafkaBrokers,
  retry: { retries: 3 }
});

const consumer = kafka.consumer({ groupId: 'audit-service-group' });

async function initConsumer() {
  try {
    await consumer.connect();
    await consumer.subscribe({
      topics: ['audit.events', 'ride.events', 'payment.events'],
      fromBeginning: false
    });
    console.log('[AUDIT_KAFKA] Subscribed to audit.events, ride.events, payment.events');

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          console.log(`[AUDIT_KAFKA] Event received on ${topic}:`, payload.eventType);

          await AuditModel.logAction({
            action: payload.eventType || 'SYSTEM_EVENT',
            resource: topic,
            userId: payload.data?.userId || payload.data?.customerId || 'system',
            username: payload.data?.username || 'system',
            details: payload.data || payload,
            status: 'COMPLETED'
          });
        } catch (e) {
          console.error('[AUDIT_KAFKA] Error logging event:', e.message);
        }
      }
    });
  } catch (err) {
    console.warn('[AUDIT_KAFKA] Consumer connection warning:', err.message);
  }
}

module.exports = {
  initConsumer
};
