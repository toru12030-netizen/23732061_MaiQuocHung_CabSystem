const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { globalRateLimiter } = require('./middlewares/rateLimiter');
const { xssSanitizer } = require('./middlewares/xssSanitizer');
const { sendError } = require('@cab/shared-config');

// Import modular routes
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const driverRoutes = require('./routes/driverRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 1. Middlewares cơ bản & Bảo mật
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(xssSanitizer); // STT 26: XSS Sanitization

// 2. Correlation ID Middleware
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || `corr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
});

// 3. Global Rate Limiter
app.use(globalRateLimiter);

// 4. Mount Routes (hỗ trợ cả root và tiền tố API_BASE_PATH /api/v1)
const base = config.apiBasePath; // '/api/v1'

// --- 4.1 Health Check ---
app.use('/', healthRoutes);
app.use(base, healthRoutes);

// --- 4.2 Auth Service (REST -> gRPC) ---
app.use('/auth', authRoutes);
app.use(`${base}/auth`, authRoutes);

// --- 4.3 Customer Service (REST -> gRPC RBAC) ---
app.use('/customers', customerRoutes);
app.use(`${base}/customers`, customerRoutes);

// --- 4.4 Driver Service (REST Proxy) ---
app.use('/drivers', driverRoutes);
app.use(`${base}/drivers`, driverRoutes);

// --- 4.5 Ride Rating (Handled by Driver Service: STT 20) ---
const { createProxyHandler } = require('./controllers/proxyController');
const { authenticateJWT } = require('./middlewares/auth');
const driverProxy = createProxyHandler(config.services.driver);
app.post(['/rides/:rideId/rating', `${base}/rides/:rideId/rating`], authenticateJWT, driverProxy);

// --- 4.6 Booking Service (REST Proxy) ---
app.use('/bookings', bookingRoutes);
app.use(`${base}/bookings`, bookingRoutes);
app.use('/booking', bookingRoutes);
app.use(`${base}/booking`, bookingRoutes);
app.use('/rides', bookingRoutes);
app.use(`${base}/rides`, bookingRoutes);

// --- 4.6 Payment Service (REST Proxy) ---
app.use('/payments', paymentRoutes);
app.use(`${base}/payments`, paymentRoutes);
app.use('/pricing', paymentRoutes);
app.use(`${base}/pricing`, paymentRoutes);

// --- 4.7 Admin Service (RBAC Protected: STT 22) ---
app.use('/admin', adminRoutes);
app.use(`${base}/admin`, adminRoutes);

// 5. 404 Handler
app.use((req, res) => {
  return sendError(res, 404, 'NOT_FOUND', `Endpoint not found: ${req.method} ${req.originalUrl}`);
});

// 6. Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[GATEWAY ERROR]:', err);
  return sendError(res, err.status || 500, 'INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred at Gateway');
});

// 7. Start Gateway Server
const server = app.listen(config.port, () => {
  console.log(`[API GATEWAY] listening on port ${config.port} | Modular Clean Architecture`);
});

module.exports = app;
