const { Kafka } = require('kafkajs');
const { EVENT_TOPICS } = require('@cab/event-contracts');
const AuditLogModel = require('../models/auditLogModel');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'cab-kafka:9092').split(',');

let consumer = null;

async function startAdminConsumer() {
  try {
    const kafka = new Kafka({
      clientId: 'admin-service-consumer',
      brokers: KAFKA_BROKERS
    });
    consumer = kafka.consumer({ groupId: 'cab-admin-audit-group' });
    await consumer.connect();
    console.log('[ADMIN_KAFKA] Audit consumer connected to Kafka');

    await consumer.subscribe({
      topics: [
        EVENT_TOPICS.RIDE_REQUESTED,
        EVENT_TOPICS.PAYMENT_COMPLETED,
        EVENT_TOPICS.RIDE_CANCELED
      ],
      fromBeginning: false
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          await AuditLogModel.logAction({
            action: event.eventType || topic,
            adminId: 'SYSTEM_AUDITOR',
            adminUsername: 'kafka_audit_worker',
            target: topic,
            details: JSON.stringify(event.payload),
            correlationId: event.correlationId
          });
        } catch (e) {
          console.error('[ADMIN_KAFKA] Audit logging error:', e.message);
        }
      }
    });
  } catch (err) {
    console.warn('[ADMIN_KAFKA] Kafka consumer initialization warning:', err.message);
  }
}

module.exports = {
  startAdminConsumer
};
