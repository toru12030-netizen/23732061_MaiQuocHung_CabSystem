const express = require('express');
const cors = require('cors');
const config = require('./config');
const { connectDB } = require('./config/db');
const { initConsumer } = require('./events/auditConsumer');
const auditRoutes = require('./routes/auditRoutes');
const { sendSuccess } = require('@cab/shared-config');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  return sendSuccess(res, {
    service: 'audit-service',
    status: 'UP',
    port: config.port,
    database: 'CONNECTED',
    timestamp: new Date().toISOString()
  }, 200, 'Audit service is healthy');
});

// Mount routes
app.use('/audit', auditRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/admin', auditRoutes);
app.use('/api/v1/admin', auditRoutes);

async function startServer() {
  try {
    await connectDB();
    await initConsumer();

    app.listen(config.port, () => {
      console.log(`[AUDIT_SERVICE] Server running on port ${config.port}`);
    });
  } catch (err) {
    console.error('[AUDIT_SERVICE] Failed to start:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
