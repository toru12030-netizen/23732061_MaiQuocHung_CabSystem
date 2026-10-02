// Kafka Event Topics
const EVENT_TOPICS = {
  RIDE_REQUESTED: 'cab.ride.requested',
  DRIVER_OFFERED: 'cab.driver.offered',
  RIDE_ACCEPTED: 'cab.ride.accepted',
  RIDE_STARTED: 'cab.ride.started',
  RIDE_COMPLETED: 'cab.ride.completed',
  RIDE_CANCELED: 'cab.ride.canceled',
  PAYMENT_PENDING: 'cab.payment.pending',
  PAYMENT_COMPLETED: 'cab.payment.completed',
  PAYMENT_FAILED: 'cab.payment.failed',
  NOTIFICATION_DISPATCH: 'cab.notification.dispatch'
};

function createEvent(eventType, payload, correlationId = null) {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    timestamp: new Date().toISOString(),
    correlationId: correlationId || `corr_${Date.now()}`,
    payload
  };
}

module.exports = {
  EVENT_TOPICS,
  createEvent
};
