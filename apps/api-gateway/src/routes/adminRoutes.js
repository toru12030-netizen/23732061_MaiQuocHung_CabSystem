const express = require('express');
const router = express.Router();
const config = require('../config');
const { createProxyHandler } = require('../controllers/proxyController');
const { authenticateJWT, requireRoles } = require('../middlewares/auth');

const driverProxy = createProxyHandler(config.services.driver);
const adminProxy = createProxyHandler(config.services.admin);

// STT 22: Xem danh sách hồ sơ tài xế (Quản trị viên)
router.get(['/drivers', '/drivers/pending'], authenticateJWT, requireRoles('admin'), (req, res, next) => {
  req.originalUrl = `/drivers${req.url.replace(/^\/drivers/, '')}`;
  return driverProxy(req, res, next);
});

// STT 22: Duyệt hồ sơ tài xế (Quản trị viên - Yêu cầu role admin)
router.put('/drivers/:id/approval', authenticateJWT, requireRoles('admin'), (req, res, next) => {
  // Chuyển hướng tới driver-service /drivers/:id/approval
  req.originalUrl = `/drivers/${req.params.id}/approval`;
  return driverProxy(req, res, next);
});

const auditProxy = createProxyHandler(config.services.audit);

// Audit logs (chuyển tiếp tới audit-service)
router.get(['/audit-logs', '/logs'], authenticateJWT, requireRoles('admin'), auditProxy);

module.exports = router;
