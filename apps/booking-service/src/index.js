const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

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
    service: 'booking-service',
    status: 'UP',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Mount modular booking routes
app.use('/api/v1/bookings', bookingRoutes);
app.use('/bookings', bookingRoutes);
app.use('/api/v1/rides', bookingRoutes);
app.use('/rides', bookingRoutes);
app.use('/api/v1', bookingRoutes);
app.use('/', bookingRoutes);

app.listen(PORT, () => {
  console.log(`[BOOKING SERVICE] listening on port ${PORT}`);
});

module.exports = app;
