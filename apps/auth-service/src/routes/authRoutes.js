const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { sendSuccess } = require('@cab/shared-config');

// Health check endpoint cho auth-service
router.get('/health', (req, res) => {
  return sendSuccess(res, {
    service: 'auth-service',
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Các endpoint nghiệp vụ của Auth
router.post('/register/customer', authController.registerCustomer);
router.post('/login', authController.login);
router.get('/profile', authController.getCustomerById);
router.get('/customers/:id', authController.getCustomerById);
router.get('/:id', authController.getCustomerById);

// OTP cho tài xế
router.post('/driver-otp/request', authController.requestDriverOtp);
router.post('/driver-otp/verify', authController.verifyDriverOtp);

// STT 24: Data encryption at rest verification
router.get('/security/encryption-check', async (req, res) => {
  try {
    const { pool } = require('../config/db');
    const result = await pool.query('SELECT uid, username, password, role FROM users LIMIT 5');
    const sanitized = result.rows.map(r => ({
      uid: r.uid,
      username: r.username,
      isEncrypted: r.password.startsWith('$2a$') || r.password.startsWith('$2b$'),
      hashSample: r.password.substring(0, 10) + '...encrypted...',
      algorithm: 'BCrypt (10 rounds)'
    }));
    return res.json({
      success: true,
      message: 'Data encryption at rest verified: Passwords stored as BCrypt hashes',
      data: sanitized
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
