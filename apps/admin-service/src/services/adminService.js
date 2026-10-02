const AuditLogModel = require('../models/auditLogModel');

const AdminService = {
  async getAuditLogs(limit = 20) {
    return AuditLogModel.findRecent(limit);
  },

  async recordLog(entry) {
    return AuditLogModel.logAction(entry);
  }
};

module.exports = AdminService;
