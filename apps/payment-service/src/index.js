const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// Health check
app.get(['/health', '/api/v1/health'], async (req, res) => {
  let dbStatus = 'DISCONNECTED';
  try {
    const dbRes = await db.query('SELECT 1');
    if (dbRes.rowCount) dbStatus = 'CONNECTED';
  } catch (e) {
    dbStatus = 'ERROR: ' + e.message;
  }
  res.json({
    success: true,
    service: 'payment-service',
    status: 'UP',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Mount modular payment routes
app.use('/api/v1/payments', paymentRoutes);
app.use('/payments', paymentRoutes);
app.use('/api/v1', paymentRoutes);
app.use('/', paymentRoutes);

app.listen(PORT, () => {
  console.log(`[PAYMENT SERVICE] listening on port ${PORT}`);
});

module.exports = app;
