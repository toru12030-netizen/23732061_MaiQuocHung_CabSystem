const { Kafka } = require('kafkajs');
const { EVENT_TOPICS } = require('@cab/event-contracts');
const NotificationModel = require('../models/notificationModel');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'cab-kafka:9092').split(',');

let consumer = null;

async function startNotificationConsumer() {
  try {
    const kafka = new Kafka({
      clientId: 'notification-service-consumer',
      brokers: KAFKA_BROKERS
    });
    consumer = kafka.consumer({ groupId: 'cab-notification-group' });
    await consumer.connect();
    console.log('[NOTIFICATION_KAFKA] Consumer connected to Kafka');

    await consumer.subscribe({
      topics: [
        EVENT_TOPICS.RIDE_REQUESTED,
        EVENT_TOPICS.RIDE_ACCEPTED,
        EVENT_TOPICS.RIDE_COMPLETED,
        EVENT_TOPICS.RIDE_CANCELED,
        EVENT_TOPICS.PAYMENT_COMPLETED
      ],
      fromBeginning: false
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const raw = message.value.toString();
          const event = JSON.parse(raw);
          console.log(`[NOTIFICATION_KAFKA] Received event from topic ${topic}:`, event.eventType);

          const payload = event.payload;
          if (topic === EVENT_TOPICS.RIDE_ACCEPTED) {
            await NotificationModel.createNotification({
              userId: payload.customer_id,
              title: 'Tài xế đã nhận chuyến',
              message: `Tài xế ${payload.driver_id} đã nhận chuyến đi của bạn.`,
              type: 'RIDE_ACCEPTED',
              data: payload
            });
          } else if (topic === EVENT_TOPICS.RIDE_COMPLETED) {
            await NotificationModel.createNotification({
              userId: payload.customer_id,
              title: 'Chuyến đi hoàn thành',
              message: `Chuyến đi đã hoàn tất. Cước phí: ${payload.actual_fare || payload.estimated_fare} VND.`,
              type: 'RIDE_COMPLETED',
              data: payload
            });
          } else if (topic === EVENT_TOPICS.PAYMENT_COMPLETED) {
            await NotificationModel.createNotification({
              userId: payload.customer_id,
              title: 'Thanh toán thành công',
              message: `Bạn đã thanh toán thành công ${payload.amount} VND qua ${payload.method}.`,
              type: 'PAYMENT_COMPLETED',
              data: payload
            });
          }
        } catch (msgErr) {
          console.error('[NOTIFICATION_KAFKA] Error processing message:', msgErr.message);
        }
      }
    });
  } catch (err) {
    console.warn('[NOTIFICATION_KAFKA] Kafka consumer initialization warning:', err.message);
  }
}

module.exports = {
  startNotificationConsumer
};
