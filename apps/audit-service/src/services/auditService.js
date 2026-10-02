const AuditModel = require('../models/auditModel');

const AuditService = {
  async logAction(data) {
    return await AuditModel.logAction(data);
  },

  async queryLogs(query) {
    return await AuditModel.queryLogs(query);
  },

  async recordSecurityEvent(data) {
    return await AuditModel.recordSecurityEvent(data);
  },

  async querySecurityEvents(query) {
    return await AuditModel.querySecurityEvents(query);
  }
};

module.exports = AuditService;
