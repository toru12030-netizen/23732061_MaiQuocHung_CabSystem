const express = require('express');
const router = express.Router();
const authGrpcController = require('../controllers/authGrpcController');
const { authenticateJWT } = require('../middlewares/auth');

const config = require('../config');
const { createProxyHandler } = require('../controllers/proxyController');
const driverProxy = createProxyHandler(config.services.driver);

// POST /auth/register (Khách hàng)
router.post('/register', authGrpcController.register);

// POST /auth/login
router.post('/login', authGrpcController.login);

// POST /auth/logout (Yêu cầu JWT)
router.post('/logout', authenticateJWT, authGrpcController.logout);

// STT 21: Đăng ký tài xế (OTP & Register)
router.post('/driver-otp/request', (req, res, next) => {
  req.originalUrl = '/drivers/otp/request';
  return driverProxy(req, res, next);
});
router.post('/driver-otp/verify', (req, res, next) => {
  req.originalUrl = '/drivers/otp/verify';
  return driverProxy(req, res, next);
});
router.post('/register/driver', (req, res, next) => {
  req.originalUrl = '/drivers/register';
  return driverProxy(req, res, next);
});

// STT 24: Data encryption at rest check
const authHttpProxy = createProxyHandler(config.services.auth);
router.get('/security/encryption-check', (req, res, next) => {
  req.originalUrl = '/security/encryption-check';
  return authHttpProxy(req, res, next);
});

module.exports = router;
