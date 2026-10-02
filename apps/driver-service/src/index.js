const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const driverRoutes = require('./routes/driverRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Initialize MongoDB connection
connectDB().catch(err => {
  console.error('[DRIVER_SERVICE] Failed to connect to MongoDB on startup:', err);
});

// Health check
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.json({
    success: true,
    service: 'driver-service',
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Mount modular driver routes
app.use('/api/v1/drivers', driverRoutes);
app.use('/drivers', driverRoutes);
app.use('/api/v1', driverRoutes); // Hỗ trợ /api/v1/rides/:id/rating
app.use('/', driverRoutes);

app.listen(PORT, () => {
  console.log(`[DRIVER SERVICE] listening on port ${PORT}`);
});

module.exports = app;
