const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { startNotificationConsumer } = require('./events/notificationConsumer');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Initialize DB and Kafka Consumer
connectDB()
  .then(() => startNotificationConsumer())
  .catch(err => console.error('[NOTIFICATION_SERVICE] Startup error:', err.message));

// Health check
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.json({
    success: true,
    service: 'notification-service',
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/', notificationRoutes);

app.listen(PORT, () => {
  console.log(`[NOTIFICATION SERVICE] listening on port ${PORT}`);
});

module.exports = app;
