const AuditService = require('../services/auditService');
const { sendSuccess, sendError } = require('@cab/shared-config');

const AuditController = {
  async logAction(req, res) {
    try {
      const data = {
        ...req.body,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
      };
      const log = await AuditService.logAction(data);
      return sendSuccess(res, log, 201, 'Audit log recorded');
    } catch (err) {
      return sendError(res, 500, 'LOG_ACTION_FAILED', err.message);
    }
  },

  async listAuditLogs(req, res) {
    try {
      const { action, resource, userId, from, to, page, limit } = req.query;
      const result = await AuditService.queryLogs({
        action,
        resource,
        userId,
        from,
        to,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '20', 10)
      });
      return sendSuccess(res, result, 200, 'Audit logs retrieved');
    } catch (err) {
      return sendError(res, 500, 'QUERY_AUDIT_LOGS_FAILED', err.message);
    }
  },

  async recordSecurityEvent(req, res) {
    try {
      const data = {
        ...req.body,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
      };
      const event = await AuditService.recordSecurityEvent(data);
      return sendSuccess(res, event, 201, 'Security event recorded');
    } catch (err) {
      return sendError(res, 500, 'RECORD_SECURITY_EVENT_FAILED', err.message);
    }
  },

  async listSecurityEvents(req, res) {
    try {
      const { eventType, severity, page, limit } = req.query;
      const result = await AuditService.querySecurityEvents({
        eventType,
        severity,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '20', 10)
      });
      return sendSuccess(res, result, 200, 'Security events retrieved');
    } catch (err) {
      return sendError(res, 500, 'QUERY_SECURITY_EVENTS_FAILED', err.message);
    }
  }
};

module.exports = AuditController;
