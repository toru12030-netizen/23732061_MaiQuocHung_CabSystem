const express = require('express');
const router = express.Router();
const config = require('../config');
const { createProxyHandler } = require('../controllers/proxyController');
const { authenticateJWT, requireRoles } = require('../middlewares/auth');

const auditProxy = createProxyHandler(config.services.audit);

// Viewing audit logs requires Admin role (RBAC)
router.get(['/logs', '/admin/audit-logs'], authenticateJWT, requireRoles('admin'), auditProxy);
router.get('/security-events', authenticateJWT, requireRoles('admin'), auditProxy);

// Internal services recording logs
router.post('/logs', auditProxy);
router.post('/security-events', auditProxy);

module.exports = router;
