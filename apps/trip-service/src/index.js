const express = require('express');
const cors = require('cors');
const config = require('./config');
const { connectDB } = require('./config/db');
const { initProducer } = require('./events/tripProducer');
const { initConsumer } = require('./events/tripConsumer');
const tripRoutes = require('./routes/tripRoutes');
const { sendSuccess } = require('@cab/shared-config');

const app = express();

app.use(cors());
app.use(express.json());

// Health checks
app.get('/health', (req, res) => {
  return sendSuccess(res, {
    service: 'trip-service',
    status: 'UP',
    port: config.port,
    database: 'CONNECTED',
    timestamp: new Date().toISOString()
  }, 200, 'Trip service is healthy');
});

// Mount routes
app.use('/trips', tripRoutes);
app.use('/api/v1/trips', tripRoutes);

async function startServer() {
  try {
    await connectDB();
    await initProducer();
    await initConsumer();

    app.listen(config.port, () => {
      console.log(`[TRIP_SERVICE] Server running on port ${config.port}`);
    });
  } catch (err) {
    console.error('[TRIP_SERVICE] Failed to start:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
