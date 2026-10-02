const AuditLogModel = require('../models/auditLogModel');
const { sendError } = require('@cab/shared-config');

const adminController = {
  async getAuditLogs(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const logs = await AuditLogModel.findRecent(limit);
      return res.status(200).json({
        success: true,
        message: 'Audit logs retrieved successfully',
        data: logs
      });
    } catch (err) {
      console.error('[ADMIN_CONTROLLER] getAuditLogs error:', err);
      return sendError(res, 500, 'RETRIEVE_FAILED', err.message);
    }
  }
};

module.exports = adminController;
