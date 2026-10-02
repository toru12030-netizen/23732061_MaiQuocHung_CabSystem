const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { startAdminConsumer } = require('./events/adminConsumer');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

// Initialize DB and Kafka Consumer
connectDB()
  .then(() => startAdminConsumer())
  .catch(err => console.error('[ADMIN_SERVICE] Startup error:', err.message));

// Health check
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.json({
    success: true,
    service: 'admin-service',
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/admin', adminRoutes);
app.use('/admin', adminRoutes);
app.use('/', adminRoutes);

app.listen(PORT, () => {
  console.log(`[ADMIN SERVICE] listening on port ${PORT}`);
});

module.exports = app;
