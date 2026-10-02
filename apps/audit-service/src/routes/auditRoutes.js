const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/auditController');
const { validateLogInput, validateSecurityEvent } = require('../middlewares/auditValidator');

// Audit logs
router.post('/logs', validateLogInput, AuditController.logAction);
router.get('/logs', AuditController.listAuditLogs);
router.get('/admin/audit-logs', AuditController.listAuditLogs);

// Security events (SQLi, XSS, JWT tampering tracking)
router.post('/security-events', validateSecurityEvent, AuditController.recordSecurityEvent);
router.get('/security-events', AuditController.listSecurityEvents);

module.exports = router;
