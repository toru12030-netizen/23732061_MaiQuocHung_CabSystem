const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get(['/audit-logs', '/logs'], adminController.getAuditLogs);

module.exports = router;
