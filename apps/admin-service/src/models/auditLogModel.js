const { getAuditLogsCollection } = require('../config/db');

const AuditLogModel = {
  async logAction({ action, adminId, adminUsername, target, details, correlationId }) {
    const col = getAuditLogsCollection();
    const doc = {
      action,
      adminId,
      adminUsername: adminUsername || 'admin',
      target,
      details,
      correlationId: correlationId || `corr_${Date.now()}`,
      timestamp: new Date()
    };
    const res = await col.insertOne(doc);
    return { _id: res.insertedId, ...doc };
  },

  async findRecent(limit = 20) {
    const col = getAuditLogsCollection();
    return col.find().sort({ timestamp: -1 }).limit(limit).toArray();
  }
};

module.exports = AuditLogModel;
